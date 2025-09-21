# 进程间通信（IPC）

进程间通信的方式主要有六种：管道、信号量、信号、消息队列、共享内存、套接字。

---

## 管道（PIPE）

> 半双工，如果两个进程需要通信，需要创建两条管道。本质是一个内核缓冲区，进程以先进先出的方式从缓冲区读取数据：管道一端写入数据，另一端读取数据。
> 
> 管道分为匿名管道和命名管道：
> 
>   1. 匿名管道通常用于有亲缘关系的进程之间进行通信
> 
>   2. 命名管道可以在任意两个进程之间进行通信

### 匿名管道

> Linux 下存在 pipe 和 pipe2，主要区别在于 pipe2 支持选项入参
> 
> pipe2 的 flag 参数值包含：O_CLOEXEC、O_DIRECT、O_NONBLOCK、O_NOTIFICATION_PIPE

Linux 下示例代码如下：

```cpp
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <sys/wait.h>
#include <iostream>

int main() {
    int pipefd[2] = {0};

    // pipefd[0] 为管道读端
    // pipefd[1] 为管道写端
    if (::pipe(pipefd) != 0) {
        std::cerr << "create unnamed pipe failed" << std::endl;
        return -1;
    }

    pid_t cpid = ::fork();
    if (cpid == -1) {
        std::cerr << "create child process failed" << std::endl;
        return -1;
    }

    // father -> 1 == 0 -> child
    if (cpid == 0) {
        // 子进程
        ::close(pipefd[1]); // 关闭管道写端
        char rbuf[1024] = {0};
        ssize_t rsize = ::read(pipefd[0], rbuf, 1024);
        std::cout << "recv(" << rsize << "): " << rbuf << std::endl;
        ::close(pipefd[0]);
    } else {
        // 父进程
        ::close(pipefd[0]); // 关闭管道读端
        char wbuf[] = "hello! I am father process.";
        ssize_t wsize = ::write(pipefd[1], wbuf, sizeof(wbuf));
        std::cout << "send(" << wsize << "): " << wbuf << std::endl;
        ::close(pipefd[1]);
        ::wait(NULL); // 等待子进程结束
    }
    return 0;
}
```

### 命名管道

> Linux 下存在 mkfifo 和 mkfifoat，主要区别在于 mkfifoat 支持在指定文件描述符上进行创建
> 
> mkfifo 和 mkfifoat 的 mode 参数值主要表示了管道的权限
> 
> mkfifo 主要用于创建 fifo 文件；如果文件存在，也可以使用 open 进行打开。

Linux 下示例代码如下：

```cpp
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <iostream>

int main() {
    const char* fifo_fpath = "./pipe.fifo";

    if (::access(fifo_fpath, F_OK) != 0) { // 判断 fifo 文件是否存在
        // fifo 不存在，创建 fifo 文件
        if (::mkfifo(fifo_fpath, 0777) != 0) {
            std::cerr << "create fifo's file failed" << std::endl;
            return -1;
        }
    }

    pid_t cpid = ::fork();
    if (cpid == -1) {
        std::cerr << "create child process failed" << std::endl;
        return -1;
    }

    if (cpid == 0) {
        // 子进程
        int pipe_fd = ::open(fifo_fpath, O_RDONLY);
        if (pipe_fd == -1) {
            std::cerr << "open fifo file for read failed" << std::endl;
            return -1;
        }
        char rbuf[1024] = {0};
        ssize_t rsize = ::read(pipe_fd, rbuf, 1024);
        std::cout << "recv(" << rsize << "): " << rbuf << std::endl;
        ::close(pipe_fd);
    } else {
        // 父进程
        int pipe_fd = ::open(fifo_fpath, O_WRONLY);
        if (pipe_fd == -1) {
            std::cerr << "open fifo file for write failed" << std::endl;
            return -1;
        }
        char wbuf[] = "hello! I am father process.";
        ssize_t wsize = ::write(pipe_fd, wbuf, sizeof(wbuf));
        std::cout << "send(" << wsize << "): " << wbuf << std::endl;
        ::close(pipe_fd);
        ::wait(NULL); // 等待子进程结束
    }
    return 0;
}
```

### 引用

- [Linux 管道pipe的实现原理](https://segmentfault.com/a/1190000009528245)

---

## 信号量

> 信号量实际是一个计数器。主要用于进程间得互斥与同步，可以用来控制多个进程对共享资源的访问。
> 
> 工作原理：
> 
>   1. P(sv): 如果 sv 大于 0，就减 1；如果 sv 等于 0，就挂起该进程
>   2. V(sv): 如果有其他进程因等待 sv 被挂起，就唤醒它；否则，就将 sv 加 1
> 
> 在进行 PV 操作时均为原子操作
> 
> Linux 下使用 semget、semop、semctl 对信号量进行操作；使用 ipcs、ipcrm、ipcmk 命令可以对信号量进行操作

Linux 下示例代码如下（模拟进程间同步）：

```cpp
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/ipc.h>
#include <sys/sem.h>
#include <sys/types.h>
#include <iostream>

union semun {
    int              val;    /* Value for SETVAL */
    struct semid_ds *buf;    /* Buffer for IPC_STAT, IPC_SET */
    unsigned short  *array;  /* Array for GETALL, SETALL */
    struct seminfo  *__buf;  /* Buffer for IPC_INFO
                                (Linux-specific) */
};

int main() {
    const char* ftok_fpath = "./ftok.txt";
    key_t key = ::ftok(ftok_fpath, 7);
    if (key == -1) {
        std::cerr << "create key failed" << std::endl;
        return -1;
    }

    // 创建信号量，设置能够包含 1 个资源的信号量（可以用于进程间同步）
    int sem_id = ::semget(key, 1, IPC_CREAT | 0666);
    if (sem_id == -1) {
        std::cerr << "create sem failed" << std::endl;
        return -1;
    }

    // 初始化信号量，设置初始值为 1，第二个参数表示索引
    union semun seminfo = { .val = 1 };
    if (::semctl(sem_id, 0, SETVAL, seminfo) == -1) {
        std::cerr << "init sem failed" << std::endl;
        ::semctl(sem_id, 0, IPC_RMID, NULL); // 删除信号量
        return -1;
    }

    ::srand(::time(NULL));
    auto process_task = [](int id, int sem_id) {
        ::printf("process %d is waiting to acquire resources\n", id);
        struct sembuf sem_op = {
            .sem_num = 0, // 操作的信号量索引
            .sem_op = -1, // -1 表示消费一个资源
            .sem_flg = 0 // 无特殊标志
        };
        if (::semop(sem_id, &sem_op, 1) == -1) {
            ::printf("process %d failed to acquire the resource\n", id);
            ::exit(-1);
        }

        // 临界区
        ::printf("process %d has acquired the resource and started the operation\n", id);
        ::sleep(::rand() % 3 + 1);
        ::printf("process %d operation is completed and resources are released\n", id);
        
        sem_op.sem_op = 1; // 1 表示释放一个资源
        if (::semop(sem_id, &sem_op, 1) == -1) {
            ::printf("process %d failed to release resources\n", id);
            ::exit(-1);
        }
        ::printf("process %d has released resources\n", id);
    };

    // 创建 10 个子进程进行互斥
    for (int i = 0; i < 10; ++i) {
        pid_t cpid = ::fork();
        if (cpid == -1) {
            std::cerr << "create child process " << i << " failed" << std::endl;
            ::semctl(sem_id, 0, IPC_RMID, NULL); // 删除信号量
            ::exit(EXIT_FAILURE);
        } else if (cpid == 0) {
            // 子进程，调用同步任务
            process_task(i, sem_id);
            ::exit(EXIT_SUCCESS);
        }
    }

    for (int i = 0; i < 10; ++i) {
        ::wait(NULL);
    }
    ::semctl(sem_id, 0, IPC_RMID, NULL); // 删除信号量
    std::cout << "main process exit..." << std::endl;
    return 0;
}
```

> Linux 也可以使用 sem_ 函数族对信号量进行操作，主要用于**同一进程内的线程同步**，此处不做代码示例
> 
> C++ 标准使用 counting_semaphore 表示信号量，主要用于**同一进程内的线程同步**（也可以用于进程间同步，但需要配合共享内存）

C++ 信号量示例代码如下：

```cpp
#include <stdlib.h>
#include <iostream>
#include <vector>
#include <thread>
#include <semaphore>

int main() {
    // 定义信号量
    std::counting_semaphore<1> sem(1); // 最大计数 1，初始计数 1

    ::srand(::time(NULL));
    auto thread_task = [&sem](int id) {
        ::printf("thread %d is waiting to acquire resources\n", id);
        sem.acquire(); // 获取资源
        // 临界区
        ::printf("thread %d has acquired the resource and started the operation\n", id);
        ::sleep(::rand() % 3 + 1);
        ::printf("thread %d operation is completed and resources are released\n", id);
        sem.release(); // 释放资源
        ::printf("thread %d has released resources\n", id);
    };

    std::vector<std::thread> tasks; 
    for (int i = 0; i < 10; ++i) {
        tasks.emplace_back(thread_task, i);
    }

    for (auto&& task: tasks) {
        task.join();
    }
    std::cout << "main process exit..." << std::endl;
    return 0;
}
```

---

## 信号

> 信号是借助操作系统内核，进程向其他进程或线程发送的一种异步通知
> 
> Linux 下使用 signal 函数注册信号处理过程，通过 kill -数字 pid 可以向指定进程发送信号

Linux 下示例代码如下：

```cpp
#include <stdlib.h>
#include <signal.h>
#include <iostream>

int main() {
    signal(SIGINT, [](int sig) -> void {
        std::cout << "signum(2): " << sig << std::endl;
    });
    signal(SIGQUIT, [](int sig) -> void {
        std::cout << "signum(3): " << sig << std::endl;
    });

    while (true) ::sleep(1);
    return 0;
}
```

---

## 消息队列

> 消息队列就是一个消息的链表，是一系列保存在内核中消息的列表。用户进程可以向消息队列添加消息，也可以向消息队列读取消息。
> 
> 每个消息都有一个特定的类型和格式，可以根据消息的类型来接收和处理。消息队列独立于发送和接收进程，即使进程终止，消息队列中的内容也不会被删除。
> 
> Linux 下使用 msgget、msgctl、msgop 操作消息队列；使用 ipcs、ipcrm、ipcmk 命令可以对消息队列进行操作

Linux 下示例代码如下：

```cpp
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/msg.h>
#include <iostream>

struct my_msgbuf {
    long mtype;
    char mtext[1024];
};

int main() {
    const char* ftok_fpath = "./ftok.txt";
    key_t key = ::ftok(ftok_fpath, 7);
    if (key == -1) {
        std::cerr << "create key failed" << std::endl;
        return -1;
    }

    int msg_id = ::msgget(key, IPC_CREAT | 0666);
    if (msg_id == -1) {
        std::cerr << "create msg queue failed" << std::endl;
        return -1;
    }

    pid_t cpid = ::fork();
    if (cpid == -1) {
        std::cerr << "create child process failed" << std::endl;
        return -1;
    }

    if (cpid == 0) {
        // 子进程
        struct my_msgbuf msg = { .mtype = 1, .mtext = {0} };
        ssize_t rsize = ::msgrcv(msg_id, &msg, sizeof(msg.mtext), 1, 0);
        if (rsize >= 0) {
            std::cout << "recv msg: " << msg.mtext << std::endl;
        } else {
            std::cerr << "recv msg failed" << std::endl;
        }
    } else {
        // 父进程
        struct my_msgbuf msg = { .mtype = 1, .mtext = {0} };
        ::strcpy(msg.mtext, "hello! I am father process.");
        std::cout << "send msg: " << msg.mtext << std::endl;
        if (::msgsnd(msg_id, &msg, sizeof(msg.mtext), 0) != 0) {
            std::cerr << "send msg failed" << std::endl;
        }
        ::wait(NULL);
        ::msgctl(msg_id, IPC_RMID, NULL);
        std::cout << "main process exit..." << std::endl;
    }
    return 0;
}
```

---

## 共享内存

> 共享内存允许多个进程共享一块给定的内存存储区。
> 
> 优点：效率很高，因为所有进程共享同一片内存区域。
> 
> 缺点：缺乏同步机制，需要配合其他的进程间同步手段。
> 
> Linux 下有多种共享内存机制，如 shmget/shmat、shm_open、mmap、memfd、dma_buf 等

### System V 共享内存（shmget/shmat）

> 经典的 ICP 机制
> 
> 适用于传统 UNIX 程序

示例代码如下：

```cpp
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <iostream>

int main() {
    const char* ftok_fpath = "./ftok.txt";
    key_t key = ::ftok(ftok_fpath, 7);
    if (key == -1) {
        std::cerr << "create key failed" << std::endl;
        return -1;
    }

    // 申请共享内存时会初始化共享内存数据为 0
    int shm_id = ::shmget(key, 1024, IPC_CREAT | 0666);
    if (shm_id == -1) {
        std::cerr << "create shared memory failed" << std::endl;
        return -1;
    }

    pid_t cpid = ::fork();
    if (cpid == -1) {
        std::cerr << "create child process failed" << std::endl;
        return -1;
    }

    if (cpid == 0) {
        // 子进程
        char* mem = static_cast<char*>(::shmat(shm_id, NULL, 0));
        if (mem == reinterpret_cast<char*>(-1)) {
            std::cerr << "get shared memory address failed" << std::endl;
            return -1;
        }

        while (*mem != 'x') ::sleep(1);
        std::cout << "recv data: " << mem + 1 << std::endl;
        ::shmdt(mem);
    } else {
        // 父进程
        char* mem = static_cast<char*>(::shmat(shm_id, NULL, 0));
        if (mem == reinterpret_cast<char*>(-1)) {
            std::cerr << "get shared memory address failed" << std::endl;
            return -1;
        }

        const char buf[] = "hello! I am father process.";
        std::cout << "send data: " << buf << std::endl;
        ::memcpy(mem + 1, buf, sizeof(buf));
        std::cout << "set data flag" << std::endl;
        *mem = 'x';

        ::wait(NULL);
        ::shmdt(mem);
        ::shmctl(shm_id, IPC_RMID, NULL);
        std::cout << "main process exit..." << std::endl;
    }
    return 0;
}
```

### Posix 共享内存（shm_）

> 符合 posix 标准，基于文件描述符（/dev/shm）
> 
> 支持 mmap 映射，性能接近于 System V 方式
> 
> 适用于现代 Linux 程序

### 内存映射文件（mmap）

> 使用 mmap 将文件映射到内存，多个进程可共享
> 
> 适用于需要持久化存储的场景

示例代码如下（仅作简单的文件映射）：

```cpp
#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <iostream>

int main() {
    int fd = ::open("./text", O_RDWR, 0666);
    if (fd == -1) {
        std::cerr << "open text failed" << std::endl;
        return -1;
    }
    char *mem = static_cast<char*>(
        ::mmap(NULL, 1024, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0)
    );
    if (mem == reinterpret_cast<char*>(-1)) {
        std::cerr << "mmap failed" << std::endl;
        return -1;
    }
    std::cout << "text: " << mem << std::endl;
    ::munmap(mem, 1024);
    ::close(fd);
    return 0;
}
```

### 匿名共享内存（mmap）

> 使用 mmap，不依赖文件系统，仅限父子进程间共享，使用 MAP_ANONYMOUS 标志
> 
> 适用于 fork 后的进程通信

示例代码如下：

```cpp
#include <unistd.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <iostream>

int main() {
    char *mem = static_cast<char*>(
        ::mmap(NULL, 1024, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0)
    );
    if (mem == reinterpret_cast<char*>(-1)) {
        std::cerr << "mmap failed" << std::endl;
        return -1;
    }
    pid_t pid = fork();
    if (pid == 0) {
        // 子进程，向父进程写数据
        ::sprintf(mem, "hello! I am child process.");
    } else {
        // 父进程，接受子进程数据
        ::wait(NULL);
        std::cout << "recv: " << mem << std::endl;
    }
    ::munmap(mem, 1024);
    return 0;
}
```

### memfd

> 使用 memfd_create 创建匿名内存文件（仅存在于内存中），避免磁盘 I/O 开销
> 
> 适用于进程间共享数据或安全地传递敏感信息

### dma_buf

> DMA BUFFER 是 Linux 内核提供的共享内存缓冲区机制，主要用于零拷贝数据传输
> 
> 适用于跨设备、跨驱动、跨进程的场景，允许不同的硬件设备和用户态程序高效的共享同一块内存

---

## 套接字

> 套接字（socket）实际用于网络设备间通信，但也可以进行进程间通信
> 
> 通过域区分互联网通信还是本地通信，如：AF_INET 表示互联网协议；AF_UNIX 表示本地通信。

Linux 下示例代码如下：

```cpp
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <iostream>

const char* SOCKET_PATH = "./my_socket";

int main() {
    pid_t cpid = ::fork();
    if (cpid == -1) {
        std::cerr << "create child process failed" << std::endl;
        return -1;
    }

    if (cpid == 0) {
        // 子进程，作为客户端
        ::sleep(2); // 睡眠等待服务端准备好
        int sock_fd = ::socket(AF_UNIX, SOCK_STREAM, 0);
        if (sock_fd == -1) {
            std::cerr << "[client] socket failed" << std::endl;
            return -1;
        }

        struct sockaddr_un addr = { .sun_family = AF_UNIX, .sun_path = {0} };
        ::strcpy(addr.sun_path, SOCKET_PATH);
        if (::connect(sock_fd, reinterpret_cast<struct sockaddr*>(&addr), sizeof(addr)) == -1) {
            std::cerr << "[client] connect failed" << std::endl;
            return -1;
        }
        // 开始通信
        while (1) {
            std::cout << "[client] input(exit for quit): " << std::endl;
            std::string str;
            std::cin >> str;
            if (str == "exit") {
                break;
            }
            // 发送数据
            std::cout << "[client] send: " << str << std::endl;
            if (::write(sock_fd, str.c_str(), str.length()) == -1) {
                std::cerr << "[client] write error: " << errno << std::endl;
                break;
            }
            char buf[1024] = {0};
            ssize_t rsize = ::read(sock_fd, buf, sizeof(buf));
            if (rsize == -1) {
                std::cerr << "[client] recv error: " << errno << std::endl;
                break;
            }
            if (rsize == 0) {
                std::cout << "[client] server is close" << std::endl;
                break;
            }
            std::cout << "[client] recv: " << buf << std::endl;
        }
        ::close(sock_fd);
        std::cout << "[client] exit..." << std::endl;
    } else {
        // 父进程，作为服务端
        int sock_fd = ::socket(AF_UNIX, SOCK_STREAM, 0);
        if (sock_fd == -1) {
            std::cerr << "[server] socket failed" << std::endl;
            return -1;
        }
        // 删除旧的套接字文件
        ::unlink(SOCKET_PATH);

        struct sockaddr_un addr = { .sun_family = AF_UNIX, .sun_path = {0} };
        ::strcpy(addr.sun_path, SOCKET_PATH);
        if (::bind(sock_fd, reinterpret_cast<struct sockaddr*>(&addr), sizeof(addr)) == -1) {
            std::cerr << "[server] bind failed" << std::endl;
            return -1;
        }
        if (::listen(sock_fd, 5) == -1) {
            std::cerr << "[server] listen failed" << std::endl;
            return -1;
        }
        // 开始循环接受连接
        while (1) {
            struct sockaddr_un client_addr;
            socklen_t client_addr_len = sizeof(client_addr);
            int client_fd = ::accept(sock_fd, reinterpret_cast<struct sockaddr*>(&client_addr), &client_addr_len);
            if (client_fd == -1) {
                continue;
            }
            // 接受数据
            while (1) {
                char buf[1024] = {0};
                ssize_t rsize = ::read(client_fd, buf, sizeof(buf));
                if (rsize == -1) {
                    std::cerr << "[server] read client data error: " << errno << std::endl;
                    break;
                }
                if (rsize == 0) {
                    std::cout << "[server] client is close" << std::endl;
                    break;
                }
                std::cout << "[server] recv: " << buf << std::endl;
                std::cout << "[server] send: " << buf << std::endl;
                // 回传给客户端
                if (::write(client_fd, buf, rsize) == -1) {
                    std::cerr << "[server] write data to client error: " << errno << std::endl;
                    break;
                }
            }
            ::close(client_fd);
        }
        ::close(sock_fd);
        ::unlink(SOCKET_PATH);
        ::wait(NULL);
        std::cout << "[server] exit..." << std::endl;
    }
    return 0;
}
```

---
