# 通知子线程退出

## 自定义 `stop_flag` 变量

通过自定义的 `stop_flag` 原子变量通知子线程进行退出。

`stop_flag` 使用原子变量可以防止因编译器优化或指令重排而导致的未定义行为，如：编译器将其优化为从寄存器取值导致无法获取内存中的最新值

```cpp
#include <thread>
#include <chrono>
#include <atomic>

int main() {
    std::atomic_bool stop_flag = false;
    auto thr = std::thread([&stop_flag]() {
        while (!stop_flag.load(std::memory_order_acquire)) {
            // to do some things
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
    });
    // to do some things
    stop_flag.store(true, std::memory_order_release);
    thr.join();
    return 0;
}
```

## feature、promise

## stop_token

通过标准库的 stop_token 和 stop_source 可以实现通知子线程退出的目的

```cpp
#include <thread>
#include <chrono>

int main() {
    auto thr = std::jthread([](std::stop_token stop_token) {
        while (!stop_token.stop_requested()) {
            // to do some things
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
    });
    // to do some things
    thr.request_stop(); // 通知子线程停止
    thr.join();
    return true;
}
```
