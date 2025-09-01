# 迭代器源码解析

## 迭代器类型，使用 tag 表示

```cpp
// 表示输入迭代器
struct input_iterator_tag { };

// 表示输出迭代器
struct output_iterator_tag { };

// 表示前向迭代器
struct forward_iterator_tag : public input_iterator_tag { };

// 双向迭代器，继承自前向迭代器，增加后向迭代功能
struct bidirectional_iterator_tag : public forward_iterator_tag { };

// 随机访问迭代器，继承自双向迭代器，增加随机访问功能
struct random_access_iterator_tag : public bidirectional_iterator_tag { };
```

## 迭代器特征，表示迭代器包含的基本类型

```cpp
template <class _Iterator>
struct iterator_traits {
  typedef typename _Iterator::iterator_category iterator_category; // 迭代器类型，表示迭代器 tag
  typedef typename _Iterator::value_type        value_type; // 迭代器包含的值类型
  typedef typename _Iterator::difference_type   difference_type; // 迭代器之间的差异类型
  typedef typename _Iterator::pointer           pointer; // 迭代器包含的指针类型
  typedef typename _Iterator::reference         reference; // 迭代器包含的引用类型
};
```


### 原生指针类型的迭代器特征特化模板类

```cpp
template <class _Tp>
struct iterator_traits<_Tp*> {
  typedef random_access_iterator_tag iterator_category;
  typedef _Tp                         value_type;
  typedef ptrdiff_t                   difference_type;
  typedef _Tp*                        pointer;
  typedef _Tp&                        reference;
};

template <class _Tp>
struct iterator_traits<const _Tp*> {
  typedef random_access_iterator_tag iterator_category;
  typedef _Tp                         value_type;
  typedef ptrdiff_t                   difference_type;
  typedef const _Tp*                  pointer;
  typedef const _Tp&                  reference;
};
```

### 各迭代器类型定义的迭代器特征

```cpp
// 输入迭代器的类型定义
template <class _Tp, class _Distance> struct input_iterator {
  typedef input_iterator_tag iterator_category;
  typedef _Tp                value_type;
  typedef _Distance          difference_type;
  typedef _Tp*               pointer;
  typedef _Tp&               reference;
};

// 输出迭代器的类型定义
struct output_iterator {
  typedef output_iterator_tag iterator_category;
  typedef void                value_type;
  typedef void                difference_type;
  typedef void                pointer;
  typedef void                reference;
};

template <class _Tp, class _Distance> struct forward_iterator {
  typedef forward_iterator_tag iterator_category;
  typedef _Tp                  value_type;
  typedef _Distance            difference_type;
  typedef _Tp*                 pointer;
  typedef _Tp&                 reference;
};


template <class _Tp, class _Distance> struct bidirectional_iterator {
  typedef bidirectional_iterator_tag iterator_category;
  typedef _Tp                        value_type;
  typedef _Distance                  difference_type;
  typedef _Tp*                       pointer;
  typedef _Tp&                       reference;
};

template <class _Tp, class _Distance> struct random_access_iterator {
  typedef random_access_iterator_tag iterator_category;
  typedef _Tp                        value_type;
  typedef _Distance                  difference_type;
  typedef _Tp*                       pointer;
  typedef _Tp&                       reference;
};
```

## 获取迭代器的类型

```cpp
template <class _Iter>
inline typename iterator_traits<_Iter>::iterator_category
__iterator_category(const _Iter&)
{
  typedef typename iterator_traits<_Iter>::iterator_category _Category;
  return _Category();
}
```

## 常见的迭代器

### back_insert_iterator 

> 后向插入迭代器，主要用于容器的后向数据插入，原理是通过迭代器操作调用容器的 push_back

```cpp
template <class _Container>
class back_insert_iterator {
protected:
  _Container* container;
public:
  typedef _Container          container_type;
  typedef output_iterator_tag iterator_category;
  typedef void                value_type;
  typedef void                difference_type;
  typedef void                pointer;
  typedef void                reference;

  explicit back_insert_iterator(_Container& __x) : container(&__x) {}
  back_insert_iterator<_Container>&
  operator=(const typename _Container::value_type& __value) {  // 赋值给当前迭代器
    container->push_back(__value); // 核心代码，调用 push_back 插入数据
    return *this;
  }
  back_insert_iterator<_Container>& operator*() { return *this; }
  back_insert_iterator<_Container>& operator++() { return *this; }
  back_insert_iterator<_Container>& operator++(int) { return *this; }
};

// 属于输出迭代器类型
template <class _Container>
inline output_iterator_tag iterator_category(const back_insert_iterator<_Container>&)
{
  return output_iterator_tag();
}
```

> 辅助函数

```cpp
template <class _Container>
inline back_insert_iterator<_Container> back_inserter(_Container& __x) {
  return back_insert_iterator<_Container>(__x);
}
```

### front_insert_iterator

> 前向插入迭代器，主要用于容器的前向数据插入，原理是通过迭代器操作调用容器的 push_front

```cpp
template <class _Container>
class front_insert_iterator {
protected:
  _Container* container;
public:
  typedef _Container          container_type;
  typedef output_iterator_tag iterator_category;
  typedef void                value_type;
  typedef void                difference_type;
  typedef void                pointer;
  typedef void                reference;

  explicit front_insert_iterator(_Container& __x) : container(&__x) {}
  front_insert_iterator<_Container>&
  operator=(const typename _Container::value_type& __value) { 
    container->push_front(__value);
    return *this;
  }
  front_insert_iterator<_Container>& operator*() { return *this; }
  front_insert_iterator<_Container>& operator++() { return *this; }
  front_insert_iterator<_Container>& operator++(int) { return *this; }
};

// 属于输出迭代器类型
template <class _Container>
inline output_iterator_tag iterator_category(const front_insert_iterator<_Container>&)
{
  return output_iterator_tag();
}
```

> 辅助函数

```cpp
template <class _Container>
inline front_insert_iterator<_Container> front_inserter(_Container& __x) {
  return front_insert_iterator<_Container>(__x);
}
```

### insert_iterator

> 插入迭代器，主要用于容器的数据插入，原理是通过迭代器操作调用容器的 insert

```cpp
template <class _Container>
class insert_iterator {
protected:
  _Container* container;
  typename _Container::iterator iter;
public:
  typedef _Container          container_type;
  typedef output_iterator_tag iterator_category;
  typedef void                value_type;
  typedef void                difference_type;
  typedef void                pointer;
  typedef void                reference;

  insert_iterator(_Container& __x, typename _Container::iterator __i) // 获取容器在迭代器 i 的插入迭代器
    : container(&__x), iter(__i) {}
  insert_iterator<_Container>&
  operator=(const typename _Container::value_type& __value) { 
    iter = container->insert(iter, __value); // 在指定迭代器之前插入数据
    ++iter; // 自增内部迭代器
    return *this;
  }
  insert_iterator<_Container>& operator*() { return *this; }
  insert_iterator<_Container>& operator++() { return *this; }
  insert_iterator<_Container>& operator++(int) { return *this; }
};

// 属于输出迭代器类型
template <class _Container>
inline output_iterator_tag iterator_category(const insert_iterator<_Container>&)
{
  return output_iterator_tag();
}
```

> 辅助函数

```cpp
template <class _Container, class _Iterator>
inline insert_iterator<_Container> inserter(_Container& __x, _Iterator __i)
{
  typedef typename _Container::iterator __iter;
  return insert_iterator<_Container>(__x, __iter(__i));
}
```

### 剩余迭代器介绍，不再详细描述

- reverse_bidirectional_iterator：反转双向迭代器，属于双向迭代器类型，用于反转遍历容器
- reverse_iterator：反转迭代器，属于随机访问迭代器类型，相比 reverse_bidirectional_iterator 增加了随机化数据访问
- istream_iterator：输入流迭代器，属于输入迭代器类型
- ostream_iterator：输出流迭代器，属于输出迭代器类型

## 常见面试题

### 1. 什么是迭代器？它的主要作用是什么？
**解析**：  
迭代器是一种抽象的设计模式，本质是一个“可遍历容器元素的对象”。它封装了对容器内部数据的访问逻辑，允许开发者通过统一的接口（如`++`、`*`等）遍历容器元素，而无需暴露容器的内部实现细节（如数组的下标、链表的指针等）。  

**作用**：  
- 提供统一的遍历接口，使算法（如`std::for_each`、`std::sort`）可以跨容器复用；  
- 解耦容器与算法，算法无需关心容器的具体类型（数组、链表、树等）。  

### 2. C++迭代器分为哪几类？各自的特点是什么？
**解析**：  
C++标准将迭代器分为5类，按功能从弱到强排序：  

| 迭代器类型       | 支持的操作                                                                 | 典型容器举例               |
|------------------|--------------------------------------------------------------------------|----------------------------|
| 输入迭代器（Input Iterator） | 只读，支持`++`、`*`、`!=`、`==`，只能单步向前遍历（且遍历过程中元素可能被消费） | `istream_iterator`         |
| 输出迭代器（Output Iterator） | 只写，支持`++`、`*`，只能单步向前遍历（用于写入数据）                       | `ostream_iterator`         |
| 前向迭代器（Forward Iterator） | 可读可写，支持输入/输出迭代器的所有操作，且可重复遍历（元素不会被消费）       | `std::forward_list`        |
| 双向迭代器（Bidirectional Iterator） | 支持前向迭代器的所有操作，还支持`--`（可向后遍历）                           | `std::list`、`std::set`    |
| 随机访问迭代器（Random Access Iterator） | 支持双向迭代器的所有操作，还支持随机访问（如`it + n`、`it - n`、`[]`）         | `std::vector`、`std::deque` |

**核心区别**：功能越强的迭代器支持的操作越多（如随机访问迭代器可直接跳转到第n个元素，而双向迭代器只能一步步移动）。  

### 3. 不同容器对应的迭代器类型是什么？
**解析**：  
容器的底层实现决定了其迭代器类型（需匹配容器的访问效率）：  
- `std::vector`、`std::deque`：随机访问迭代器（底层是连续内存，支持随机访问）；  
- `std::list`、`std::set`、`std::map`：双向迭代器（底层是链表/平衡树，不支持随机访问）；  
- `std::forward_list`：前向迭代器（单向链表，只能向前遍历）；  
- `std::array`：随机访问迭代器（固定大小的连续内存）。  

### 4. 什么是迭代器失效？哪些操作会导致迭代器失效？
**解析**：  
迭代器失效指迭代器指向的位置变得无效（如指向已释放的内存或错误的元素），此时使用迭代器会导致未定义行为（崩溃、数据错误等）。  

常见导致失效的操作：  
1. **`std::vector`**：  
   - 插入元素（`push_back`、`insert`）：若触发内存扩容（原有内存不足），所有迭代器失效；若未扩容，插入点之后的迭代器失效。  
   - 删除元素（`erase`、`pop_back`）：删除点之后的迭代器失效。  

2. **`std::list`**：  
   - 插入元素：迭代器不会失效（链表节点独立，插入不影响其他节点地址）。  
   - 删除元素：只有被删除节点的迭代器失效，其他迭代器仍有效。  

3. **`std::map`/`std::set`**：  
   - 插入元素：迭代器不会失效（平衡树结构，插入不改变其他节点地址）。  
   - 删除元素：只有被删除元素的迭代器失效，其他迭代器仍有效。  

**解决方法**：操作后重新获取迭代器（如`erase`会返回下一个有效迭代器：`it = container.erase(it)`）。  

### 5. 迭代器和指针有什么区别？
**解析**：  
- **指针**：是直接指向内存地址的变量，仅适用于连续内存（如数组），功能简单（仅支持`*`、`++`等基础操作）。  
- **迭代器**：是封装了指针的类对象，可适配不同容器（连续/非连续内存），提供统一接口（如对链表迭代器的`++`实际是移动到下一个节点，而非地址+1）。  

简言之：迭代器是“广义的指针”，是指针的抽象与泛化。  

### 6. `const_iterator`和非`const_iterator`有什么区别？
**解析**：  
- `const_iterator`：只能读取元素，不能修改元素（类似`const T*`指针），通过`cbegin()`/`cend()`获取。  
- 非`const_iterator`：既可读取也可修改元素（类似`T*`指针），通过`begin()`/`end()`获取。  

**注意**：`const`容器（如`const vector<int>`）只能使用`const_iterator`。  

### 7. 为什么`std::sort`不能用于`std::list`？如何对`std::list`排序？
**解析**：  
`std::sort`算法要求迭代器必须是**随机访问迭代器**（需要支持`it + n`、`it - it2`等随机访问操作），而`std::list`的迭代器是双向迭代器，不满足要求，因此不能直接使用`std::sort`。  

**解决方案**：`std::list`提供了成员函数`sort()`，其内部通过链表特性实现排序，无需随机访问迭代器。  

### 8. 如何为自定义容器实现一个迭代器？
**解析**：  
需根据容器特性（如是否连续内存）选择迭代器类型，并重载关键运算符：  
- 前向/双向迭代器：需重载`++`、`--`（双向）、`*`、`->`、`==`、`!=`；  
- 随机访问迭代器：额外重载`+`、`-`、`+=`、`-=`、`[]`等。  

**示例**（简化的自定义数组迭代器）：  
```cpp
template <typename T>
class MyArray {
private:
    T* data;
    size_t size;
public:
    // 迭代器定义（随机访问迭代器）
    class Iterator {
    private:
        T* ptr;
    public:
        // 构造函数
        Iterator(T* p) : ptr(p) {}
        
        // 重载++（前置）
        Iterator& operator++() { ptr++; return *this; }
        // 重载--（前置）
        Iterator& operator--() { ptr--; return *this; }
        // 重载*
        T& operator*() { return *ptr; }
        // 重载[]
        T& operator[](size_t n) { return ptr[n]; }
        // 重载+
        Iterator operator+(size_t n) { return Iterator(ptr + n); }
        // 重载==
        bool operator==(const Iterator& other) { return ptr == other.ptr; }
        // 重载!=
        bool operator!=(const Iterator& other) { return ptr != other.ptr; }
    };
    
    // 提供begin()和end()
    Iterator begin() { return Iterator(data); }
    Iterator end() { return Iterator(data + size); }
};
```
