# queue 源码解析

> 当前文档为 SGI 的 queue 容器适配器的阅读笔记

## 相关头文件

- queue
- queue.h
- stl_queue.h
- stl_heap.h

## 类结构

- queue 包含 _Sequence 作为基础容器

## queue 完整解析

> queue 是一种先进先出（FIFO）的数据结构。它本质是一个容器适配器（adapter），通过使用其他容器达到队列的数据结构。

### 类默认声明

> 默认使用 deque 作为基础容器

```cpp
template <class _Tp, class _Sequence = deque<_Tp>>
class queue;
```

### 源码解析

```cpp
template <class _Tp, class _Sequence>
class queue {
  friend bool operator==(const queue&, const queue&);
  friend bool operator<(const queue&, const queue&);

public:
  typedef typename _Sequence::value_type      value_type;
  typedef typename _Sequence::size_type       size_type;
  typedef          _Sequence                  container_type;
  typedef typename _Sequence::reference       reference;
  typedef typename _Sequence::const_reference const_reference;
protected:
  _Sequence c; // 实际使用 _Sequence 作为基础容器
public:
  queue() : c() {}
  explicit queue(const _Sequence& __c) : c(__c) {}

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  reference front() { return c.front(); }
  const_reference front() const { return c.front(); }
  reference back() { return c.back(); }
  const_reference back() const { return c.back(); }
  // 只需要按照队列的结构提供压入和弹出接口即可
  void push(const value_type& __x) { c.push_back(__x); }
  void pop() { c.pop_front(); }
};

template <class _Tp, class _Sequence>
bool 
operator==(const queue<_Tp, _Sequence>& __x, const queue<_Tp, _Sequence>& __y)
{
  return __x.c == __y.c;
}

template <class _Tp, class _Sequence>
bool
operator<(const queue<_Tp, _Sequence>& __x, const queue<_Tp, _Sequence>& __y)
{
  return __x.c < __y.c;
}
```

---

## priority_queue 完整解析

> priority_queue 是一个拥有权值观念的 queue，能够达到队列有序。它本质是一个容器适配器（adapter），通过使用其他容器达到栈的数据结构。

### 类默认声明

> 默认使用 vector 作为基础容器，内部使用堆结构进行表示

```cpp
template <class _Tp, class _Sequence = vector<_Tp>, class _Compare = less<typename _Sequence::value_type>>
class priority_queue;
```

### 源码解析

```cpp
template <class _Tp, class _Sequence = vector<_Tp>, class _Compare = less<typename _Sequence::value_type>>
class priority_queue {
public:
  typedef typename _Sequence::value_type      value_type;
  typedef typename _Sequence::size_type       size_type;
  typedef          _Sequence                  container_type;
  typedef typename _Sequence::reference       reference;
  typedef typename _Sequence::const_reference const_reference;
protected:
  _Sequence c; // 基础容器
  _Compare comp; // 比较器
public:
  priority_queue() : c() {}
  explicit priority_queue(const _Compare& __x) :  c(), comp(__x) {}
  priority_queue(const _Compare& __x, const _Sequence& __s) 
    : c(__s), comp(__x) 
    { make_heap(c.begin(), c.end(), comp); } // 构建有序堆结构

#ifdef __STL_MEMBER_TEMPLATES
  template <class _InputIterator>
  priority_queue(_InputIterator __first, _InputIterator __last) 
    : c(__first, __last) { make_heap(c.begin(), c.end(), comp); }

  template <class _InputIterator>
  priority_queue(_InputIterator __first, 
                 _InputIterator __last, const _Compare& __x)
    : c(__first, __last), comp(__x) 
    { make_heap(c.begin(), c.end(), comp); }

  template <class _InputIterator>
  priority_queue(_InputIterator __first, _InputIterator __last,
                 const _Compare& __x, const _Sequence& __s)
  : c(__s), comp(__x)
  { 
    c.insert(c.end(), __first, __last);
    make_heap(c.begin(), c.end(), comp);
  }

#else /* __STL_MEMBER_TEMPLATES */
  priority_queue(const value_type* __first, const value_type* __last) 
    : c(__first, __last) { make_heap(c.begin(), c.end(), comp); }

  priority_queue(const value_type* __first, const value_type* __last, 
                 const _Compare& __x) 
    : c(__first, __last), comp(__x)
    { make_heap(c.begin(), c.end(), comp); }

  priority_queue(const value_type* __first, const value_type* __last, 
                 const _Compare& __x, const _Sequence& __c)
    : c(__c), comp(__x) 
  { 
    c.insert(c.end(), __first, __last);
    make_heap(c.begin(), c.end(), comp);
  }
#endif /* __STL_MEMBER_TEMPLATES */

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  const_reference top() const { return c.front(); } // 堆中最前面的元素就是优先级最高的元素
  void push(const value_type& __x) {
    __STL_TRY {
      c.push_back(__x);  // 在尾部加入元素
      push_heap(c.begin(), c.end(), comp); // 重排堆元素，将尾部元素加入一起重排
    }
    __STL_UNWIND(c.clear());
  }
  void pop() {
    __STL_TRY {
      pop_heap(c.begin(), c.end(), comp); // 重排堆元素，将顶部元素切换到尾部
      c.pop_back(); // 弹出尾部元素
    }
    __STL_UNWIND(c.clear());
  }
};
```