# call_once

> std::call_once 是 c++11 引入的新特性，主要用于函数或代码片段在多线程环境下，只需要执行一次。常见场景如 单例模式、init() 操作、一些系统参数的获取等。

## 头文件

- \<mutex\>

## 使用示例（单例模式）

```cpp
class SingleClass {
public:
    static SingleClass* getInstance() {
        if (m_instance == nullptr) {
            std::call_once(m_instanceFlag, [this]() {
                m_instance = new SingleClass();
            });
        }
        return m_instance;
    }

    static SingleClass* m_instance;
    static std::once_flag m_instanceFlag;
};
```

## 源码解析

### call_once

> 内部调用 pthread_once 函数，pthread_once 函数在触发调用时实际调用 __once_proxy 函数

```cpp
template<typename _Callable, typename... _Args>
void call_once(once_flag& __once, _Callable&& __f, _Args&&... __args)
{
    // 构造一个无参数的闭包函数，方便后续调用
    auto __callable = [&] {
        std::__invoke(std::forward<_Callable>(__f),
            std::forward<_Args>(__args)...);
    };

    // 预处理执行参数
    once_flag::_Prepare_execution __exec(__callable);

    // 内部实际调用 pthread_once 函数
    if (int __e = __gthread_once(&__once._M_once, &__once_proxy))
        __throw_system_error(__e);
}

static inline int __gthread_once (__gthread_once_t *__once, void (*__func) (void))
{
  if (__gthread_active_p ())
    return __gthrw_(pthread_once) (__once, __func); // 实际调用 pthread_once 函数
  else
    return -1;
}
```

### once_flag::_Prepare_execution

> 主要用于将 __c 回调函数传递给 __once_callable，并构造完全闭包函数给 __once_call 函数指针

```cpp
struct once_flag::_Prepare_execution
{
    template<typename _Callable>
    explicit _Prepare_execution(_Callable& __c)
    {
        __once_callable = std::__addressof(__c);
        __once_call = [] { (*static_cast<_Callable*>(__once_callable))(); };
    }

    ~_Prepare_execution()
    {
        // PR libstdc++/82481
        __once_callable = nullptr;
        __once_call = nullptr;
    }

    _Prepare_execution(const _Prepare_execution&) = delete;
    _Prepare_execution& operator=(const _Prepare_execution&) = delete;
};
```

### __once_proxy、__once_callable、__once_call

> __once_proxy、__once_callable、__once_call 定义在 libstdc++ 库的 mutex.cc 文件中，头文件中仅做了声明

```cpp
// 使用线程局部存储（TLS），每个线程有单独的 __once_callable、__once_call 变量
// 因为线程按序执行，所以每个线程保证一份以下变量即可，每次调用新的 call_once 重新设置以下两个变量即可
__thread void* __once_callable;
__thread void (*__once_call)();

extern "C" void __once_proxy()
{
    __once_call();
}
```

### pthread_once

> 该函数实际定义在 libpthread 库中，此处 init_routine 入参对应上述的 __once_proxy 函数

```cpp
int __pthread_once (pthread_once_t *once_control, void (*init_routine) (void))
{
    atomic_full_barrier ();
    if (once_control->__run == 0) // 还没有执行过
    {
        __pthread_spin_lock (&once_control->__lock); // 自旋锁上锁
        if (once_control->__run == 0) // 再次判断是否已执行
        {
            init_routine (); // 执行实际方法
            atomic_full_barrier ();
            once_control->__run = 1; // 标记已执行
        }
        __pthread_spin_unlock (&once_control->__lock); // 自旋锁解锁
    }
    return 0;
}
strong_alias (__pthread_once, pthread_once);
```
