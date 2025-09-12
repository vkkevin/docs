# stack 源码解析

> 当前文档为 SGI 的 stack 容器适配器的阅读笔记

## 相关头文件

- stack
- stack.h
- stl_stack.h

## 类结构

- stack 包含 _Sequence 作为基础容器

## stack 完整解析

> stack 是一种先进后出（FILO）的数据结构。它本质是一个容器适配器（adapter），通过使用其他容器达到栈的数据结构。

### 类默认声明

> 默认使用 deque 作为基础容器

```cpp
template <class _Tp, class _Sequence = deque<_Tp>>
class stack;
```

### 源码解析

```cpp
template <class _Tp, class _Sequence>
class stack {
  friend bool operator==(const stack&, const stack&);
  friend bool operator<(const stack&, const stack&);
public:
  typedef typename _Sequence::value_type      value_type;
  typedef typename _Sequence::size_type       size_type;
  typedef          _Sequence                  container_type;
  typedef typename _Sequence::reference       reference;
  typedef typename _Sequence::const_reference const_reference;
protected:
  _Sequence c; // 实际使用 _Sequence 作为基础容器
public:
  stack() : c() {}
  explicit stack(const _Sequence& __s) : c(__s) {}

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  reference top() { return c.back(); }
  const_reference top() const { return c.back(); }
  // 只需要按照栈的结构提供压入和弹出接口即可
  void push(const value_type& __x) { c.push_back(__x); }
  void pop() { c.pop_back(); }
};

// 实际均调用内部容器的接口
template <class _Tp, class _Seq>
bool operator==(const stack<_Tp,_Seq>& __x, const stack<_Tp,_Seq>& __y)
{
  return __x.c == __y.c;
}

template <class _Tp, class _Seq>
bool operator<(const stack<_Tp,_Seq>& __x, const stack<_Tp,_Seq>& __y)
{
  return __x.c < __y.c;
}
```