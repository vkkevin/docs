# 多态内存资源（Polymorphic Memory Resources）

C++17 引入了多态内存资源管理方式，提供了更容易使用的方法来支持预定义和用户自定义的内存分配方式。

## memory_resource

封装内存资源的类的抽象接口，标准库预定义了以下几个内存资源类

- synchronized_pool_resource：线程安全，用于管理不同块大小池中的内存分配
- unsynchronized_pool_resource：线程不安全，用于管理不同块大小池中的内存分配
- monotonic_buffer_resource：特殊用途，仅在资源被销毁时释放分配的内存

## polymorphic_allocator

支持基于 memory_resource 的运行时多态性的分配器，根据内部包含的不同的 memory_resource 表现出不同的分配行为。

pmr 命名空间内声明的容器类型使用 polymorphic_allocator 作为默认分配器。

## 示例（标准库容器使用栈空间）

下列示例使用栈空间为 vector 容器提供内存资源；string 不采用外部提供的栈内存空间，因字符串较短，所以此处 string 也采用栈空间进行存储。

下列代码使用 TrackNew 重载 new 和 delete 操作，跟踪堆内存分配情况，可以观察到是否在堆空间上进行内存分配。

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <array>
#include <cstdlib>  // for std::byte
#include <memory_resource>
#include "tracknew.hpp"

int main()
{
    TrackNew::reset();

    // 在栈上分配一些内存：
    std::array<std::byte, 200000> buf;
    // 将它用作vector的初始内存池：
    std::pmr::monotonic_buffer_resource pool{buf.data(), buf.size()};
    std::pmr::vector<std::string> strs{&pool};

    for (int i = 0; i < 1000; ++i) {
        strs.emplace_back("I am a string");
    }

    TrackNew::status();
    return 0;
}
```
