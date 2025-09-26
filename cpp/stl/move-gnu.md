# 移动语义源码解析

## 引用折叠

- `T& &`   -> `T&`
- `T& &&`  -> `T&`
- `T&& &`  -> `T&`
- `T&& &&` -> `T&&`

## forward

1. 如果 `_Tp` 是非引用类型，入参可以是左值也可以是右值；根据引用折叠规则，`static_cast<_Tp&&>(__t)` 会返回右值引用
2. 如果 `_Tp` 是左值引用，入参必须是左值；根据引用折叠规则，`static_cast<_Tp&&>(__t)` 会返回左值引用
3. 如果 `_Tp` 是右值引用，入参可以是左值也可以是右值；根据引用折叠规则，`static_cast<_Tp&&>(__t)` 会返回右值引用

### 完美转发一个左值

```cpp showLineNumbers
template<typename _Tp>
_GLIBCXX_NODISCARD constexpr _Tp&& // 万能引用，取决于返回的类型
forward(typename std::remove_reference<_Tp>::type& __t) noexcept // __t 为左值引用
{ return static_cast<_Tp&&>(__t); } // 取决于 _Tp 的引用方式
```

### 完美转发一个右值

```cpp showLineNumbers
template<typename _Tp>
_GLIBCXX_NODISCARD constexpr _Tp&& // 万能引用，取决于返回的类型
forward(typename std::remove_reference<_Tp>::type&& __t) noexcept // __t 为右值引用
{
    // _Tp 不能为左值引用，因为入参为右值引用，不能将右值引用转换为左值引用
    // std::forward<int&>(20); // error 编译报错
    static_assert(!std::is_lvalue_reference<_Tp>::value,
	  "std::forward must not be used to convert an rvalue to an lvalue");
    return static_cast<_Tp&&>(__t); // 取决于 _Tp 的引用方式
}
```

## move

> 转换一个值到右值，__t 匹配左值或右值，一律转换为右值引用

```cpp showLineNumbers
template<typename _Tp>
_GLIBCXX_NODISCARD constexpr typename std::remove_reference<_Tp>::type&&
move(_Tp&& __t) noexcept {
    return static_cast<typename std::remove_reference<_Tp>::type&&>(__t);
}
```

## addressof

> 获取变量真实地址；因为 & 操作符可能被重写，所以避免使用 & 获取地址

```cpp showLineNumbers
template<typename _Tp>
inline _GLIBCXX_CONSTEXPR _Tp*
__addressof(_Tp& __r) _GLIBCXX_NOEXCEPT
{ return __builtin_addressof(__r); } // 通过内建函数获取变量实际地址

template<typename _Tp>
_GLIBCXX_NODISCARD inline _GLIBCXX17_CONSTEXPR _Tp*
addressof(_Tp& __r) noexcept { return std::__addressof(__r); }

template<typename _Tp>
const _Tp* addressof(const _Tp&&) = delete; // const左值和右值引用禁止获取地址
```