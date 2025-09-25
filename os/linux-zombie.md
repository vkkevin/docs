# Linux 孤儿进程与僵尸进程

## 孤儿进程

> 一个父进程退出后，而它的一个或多个子进程还在运行，那么这些子进程将成为孤儿进程
> 
> 孤儿进程将被 init 进程（进程号为1）所收养，并且由 init 进程对它们完整状态收集工作

## 僵尸进程

> 一个进程使用 fork 函数创建子进程，如果子进程退出，而父进程并没有调用 wait 或者 waitpid 系统调用取得子进程的终止状态，那么子进程的进程描述符仍然保存在系统中，从而占用系统资源，这种进程称为僵尸进程

### 如何解决

1. 在调用 fork 函数产生子进程后，主进程要及时调用 wait 或 waidpid 系统调用

2. 在父进程中捕获 SIGCHLD 信号，内部调用 wait 或 waitpid 系统调用
    1. 当子进程退出时，内核会向父进程发送 SIGCHLD 信号

    2. 也可以使用 kill 命令单独给父进程发送 SIGCHLD 信号
    
        ```bash
            kill -s SIGCHLD pid(父进程pid)
        ```

3. 直接 kill 父进程也可以杀死所有僵尸进程

信号捕捉示例代码：

```cpp
#include <signal.h>
#include <sys/wait.h>
#include <iostream>

int main() {
    ::signal(SIGCHLD, [](int sig) {
        std::cout << "wait child befor\n";
        ::wait(NULL);
        std::cout << "wait child after\n";
    });

    for (int i = 0; i < 10; ++i) {
        pid_t cpid = ::fork();
        if (cpid == -1) {
            return -1;
        }

        if (cpid == 0) {
            ::printf("I am child process %d, exit...\n", i);
            return 1;
        }
    }

    while (1) ::sleep(2);
    return 0;
}
```
