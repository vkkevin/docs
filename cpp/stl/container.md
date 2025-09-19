# STL 容器

> STL 中常用的容器有 vector、deque、list、map、set、multimap、multiset、unordered_map、unordered_set 等
> STL 中常见的容器适配器有 stack、queue、priority_queue 等


## 常见复杂度

|容器|插入|查看|删除|描述|
|:--:|:--:|:--:|:--:|:--:|
|vector|O(n)|O(1)|O(n)|采用一维数组实现，元素在内存连续存放|
|deque|O(n)|O(1)|O(n)|采用双向队列实现，元素在内存连续存放|
|list|O(1)|O(n)|O(1)|采用双向链表实现，元素存放在堆中|
|map/multimap|O(logN)|O(logN)|O(logN)|采用红黑树实现，红黑树是平衡二叉树的一种|
|set/multiset|O(logN)|O(logN)|O(logN)|采用红黑树实现，红黑树是平衡二叉树的一种|
|unordered_map/unordered_multimap|O(1)，最坏O(n)|O(1)，最坏O(n)|O(1)，最坏O(n)|采用哈希表实现|
|unordered_set/unordered_multiset|O(1)，最坏O(n)|O(1)，最坏O(n)|O(1)，最坏O(n)|采用哈希表实现|


## 容器迭代器

|容器|容器上的迭代器类别|
|vector|随机访问|
|deque|随机访问|
|list|双向|
|set/multiset|双向|
|map/multimap|双向|
|stack|不支持迭代器|
|queue|不支持迭代器|
|priority_queue|不支持迭代器|

