# Linux 守护进程

> 守护进程是运行在后台的一种生存期长的特殊进程。它独立于控制终端，处理一些系统级别任务。

## 守护进程实现流程

1. 创建子进程，终止父进程。调用 fork 函数创建子进程，然后父进程退出。
2. 调用 setsid 函数创建一个新会话。
3. 将指定目录更改为根目录。原因：使用 fork 创建的子进程也继承了父进程的当前工作目录。
4. 重设文件权限掩码。文件权限掩码是指屏蔽掉文件权限中的对应位。
5. 关闭不再需要的文件描述符。子进程从父进程继承打开的文件描述符。

## 实现代码

```cpp
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/signal.h>
#include <sys/wait.h>
#include <iostream>

int main() {
    std::cout << "fork..." << std::endl;
    pid_t pid = ::fork();
    if (pid == -1) {
        std::cerr << "fork failed" << std::endl;
        ::exit(EXIT_FAILURE);
    }

    if (pid > 0) {
        // 主进程先退出，让守护进程成为孤儿进程，被 init 进程托管
        std::cout << "father process exit..." << std::endl;
        ::exit(EXIT_SUCCESS);
    }

    // 子进程
    std::cout << "setsid..." << std::endl;
    pid_t sid = ::setsid();
    if (sid == -1) {
        std::cerr << "setsid failed" << std::endl;
        ::exit(EXIT_FAILURE);
    }
    std::cout << "setsid: new sid = " << sid << std::endl;

    std::cout << "chdir..." << std::endl;
    if (::chdir("./") == -1) {
        std::cerr << "chdir failed" << std::endl;
        ::exit(EXIT_FAILURE);
    }

    std::cout << "umask..." << std::endl;
    if (::umask(0) == -1) {
        std::cerr << "umask failed" << std::endl;
        ::exit(EXIT_FAILURE);
    }

    std::cout << "close all file descriptor..." << std::endl;
    // 关闭父进程可能打开的所有文件描述符
    for (int i = 0; i < 65535; ++i) {
        ::close(i);
    }
    std::cout << "redirect stdin、stdout、stderr to /dev/null..." << std::endl;
    ::open("/dev/null", O_RDWR); // 打开 null 设备，占用 stdin 文件描述符
    ::dup(0); // 占用 stdout 文件描述符，指向 stdin 文件描述符，即 null 设备
    ::dup(0); // 占用 stderr 文件描述符，指向 stdin 文件描述符，即 null 设备

    std::cout << "set SIGCHLD signal hander..." << std::endl;
    // 防止子进程成为僵尸进程
    ::signal(SIGCHLD, [](int sig) { ::wait(NULL); });

    std::cout << "daemon process is running..." << std::endl;
    // 临时模拟业务常驻运行
    while (1) ::sleep(2);
    return 0;
}
```

## daemon 方法

> C 标准库提供了 daemon 方法，用于方便的创建守护进程

```cpp
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <sys/wait.h>
#include <iostream>

int main() {
    std::cout << "do daemon..." << std::endl;
    ::daemon(0, 0);

    std::cout << "set SIGCHLD signal hander..." << std::endl;
    // 防止子进程成为僵尸进程
    ::signal(SIGCHLD, [](int sig) { ::wait(NULL); });

    std::cout << "daemon process is running..." << std::endl;
    // 临时模拟业务常驻运行
    while (1) ::sleep(2);
    return 0;
}
```
