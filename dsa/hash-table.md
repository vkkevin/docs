# 哈希表（散列表）

哈希表通过建立键 key 与 值 value 之间的映射，实现高效的元素查询。

---

## 基于数组的简单实现

基于数组实现哈希表是最简单的方式，数组中的每个空位被称为桶（bucket）或槽。

通过 key 定位到元素位置需要用到**哈希函数（hash function）**，哈希函数的计算可以分为以下两步：

1. 通过某种哈希算法 hash() 计算得到哈希值。
2. 将哈希值对桶数量（数组长度）capacity 取模，从而得到该 key 对应的桶（数组索引）index。

```cpp showLineNumbers
index = hash(key) % capacity;
```

### 简单示例代码

```cpp showLineNumbers
template <typename _K, typename _V>
class hash_table {
    using key_type = _K;
    using value_type = _V;
    using kv_type = std::pair<_K, _V>;
    using bucket_type = kv_type*;

public:
    hash_table(int capacity) {
        buckets.resize(capacity, nullptr);
    }
    ~hash_table() {
        for (auto&& bucket: buckets) {
            delete bucket;
        }
    }

    int do_hash(const key_type& key) {
        return std::hash<key_type>{}(key) % buckets.size();
    }

    _V get(const key_type& key) {
        int index = do_hash(key);
        if (bucket_type bucket = buckets[index]; bucket != nullptr) {
            return bucket->second;
        }
        return _V{};
    }

    void put(const key_type& key, const _V& value) {
        int index = do_hash(key);
        bucket_type& bucket = buckets[index];
        if (bucket == nullptr) {
            bucket = new kv_type(key, value);
        } else {
            *bucket = { key, value };
        }
    }

    void remove(const key_type& key) {
        int index = do_hash(key);
        if (bucket_type& bucket = buckets[index]; bucket != nullptr) {
            delete bucket;
            bucket = nullptr;
        }
    }

private:
    std::vector<bucket_type> buckets;
};
```

---

## 哈希冲突

不同的 key 值通过哈希函数计算出相同的 index，即为哈希冲突。仅做简单的哈希算法和取模很容易产生哈希冲突。

**负载因子（load factor）**：为哈希表的元素数量除以桶的数量，用于衡量哈希冲突的严重程度，也常作为哈希表扩容的触发条件。

通常有以下几个解决方案：

1. **扩容法**：简单粗暴，直接扩容减少冲突概率，但效率较低，每次均需要拷贝数据到新缓冲区
2. **链式地址法**：可以使用**线性链表**、**动态数组**、**红黑树**等数据结构
3. **开放寻址法**：可是使用**线性探测**、**平方探测**、**多次哈希**等方法

### 链式地址法

在桶内包含一个链表或动态数组或红黑树，用于存放键值对，将所有发生冲突的键值对放在同一个桶的数据结构中。

#### 示例代码

```cpp showLineNumbers
template <typename _K, typename _V>
class hash_table {
private:
    static constexpr int s_initial_capacity = 16; // 哈希表桶的初始容量 
    static constexpr double s_load_thres = 0.75; // 触发扩容负载因子阈值
    static constexpr int s_extend_ratio = 2; // 扩展倍数

public:
    using key_type = _K;
    using value_type = _V;
    struct node_type {
        key_type key;
        value_type value;
        node_type* next;
    };
    struct bucket_type {
        node_type* head;
    };

public:
    hash_table() {
        m_buckets.resize(s_initial_capacity, {.head = nullptr});
    }
    ~hash_table() {
        destroy_buckets(m_buckets);
    }

    double load_factor() {
        return static_cast<double>(m_size) / m_buckets.size();
    }

    int do_hash(const key_type& key) {
        return std::hash<key_type>{}(key) % m_buckets.size();
    }

    _V get(const key_type& key) {
        int index = do_hash(key);
        node_type* node = m_buckets[index].head;
        while (node && node->key != key) {
            node = node->next;
        }
        return node ? node->value : _V{};
    }

    void put(const key_type& key, const _V& value) {
        if (load_factor() > s_load_thres) {
            extend();
        }
        int index = do_hash(key);
        bucket_type& bucket = m_buckets[index];
        node_type* node = new node_type{key, value, bucket.head};
        bucket.head = node;
        ++m_size;
    }

    void remove(const key_type& key) {
        int index = do_hash(key);
        node_type*& node = m_buckets[index].head;
        while (node && node->key != key) {
            node = node->next;
        }
        if (node) {
            node_type* tmp = node;
            node = node->next;
            delete tmp;
            --m_size;
        }
    }

    // 扩展哈希表
    void extend() {
        std::vector<bucket_type> old_buckets(std::move(m_buckets));
        m_buckets.resize(old_buckets.size() * s_extend_ratio, {.head = nullptr});
        for (auto& bucket: old_buckets) {
            for (node_type* node = bucket.head; node; node = node->next) {
                put(node->key, node->value);
            }
        }
        destroy_buckets(old_buckets);
    }

private:
    void destroy_buckets(std::vector<bucket_type>& buckets) {
        for (auto& bucket: buckets) {
            while (bucket.head) {
                node_type* tmp = bucket.head;
                bucket.head = bucket.head->next;
                delete tmp;
            }
        }
        std::vector<bucket_type>().swap(buckets);
    }

private:
    std::vector<bucket_type> m_buckets;
    int m_size = 0;
};
```

### 开放寻址法

开放寻址法不引入额外的数据结构，而是通过“多次探测”来处理哈希冲突，探测方式主要包括线性探测、平方探测和多次哈希等。

#### 线性探测

采用固定步长的线性搜索来进行探测，如：

- 插入元素时：若发生冲突，从冲突位置向后线性遍历（步长通常为 1），直至找到空桶，将元素插入其中。
- 查询元素时：若发生冲突，使用相同步长向后进行线性遍历，直到找到对应元素。
- 删除元素时：若发生冲突，使用相同步长向后线性遍历找到元素，如果直接删除元素会导致此处产生空位，对查询产生影响，可以增加 TOMBSTONE 标记该桶，方便查找进行跳过。

> - 优点：实现简单
> - 缺点：但容易产生“聚集现象”，哈希冲突可能会导致产生更多的冲突。

#### 平方探测

平方探测与线性探测类似，当发生冲突时，并不是采用固定步长进行线性搜索，而是跳过“探测次数的平方”的步数：即 1，4，9... 步。

> - 优点：缓解聚集现象；有助于数据分布更加均匀
> - 缺点：仍存在聚集现象；采用平方探测无法完全利用空桶，可能导致资源浪费

#### 多次哈希

使用多个哈希函数`f1(x)`、`f2(x)`、...进行探测，如：

- 插入元素时：若`f1(x)`出现冲突，则尝试`f2(x)`，以此类推，直到找到空位。
- 查找元素时：与插入元素逻辑一致，直到找到目标元素；若遇到空桶或已尝试所有哈希函数，则返回空。
- 删除元素时：依旧无法直接删除元素，同样需要采用 TOMBSTONE 机制。

> - 优点：不易产生聚集现象
> - 缺点：产生额外的计算量

---

## 哈希算法

哈希函数决定了哈希表的执行效率、元素是否分布均匀等，所以哈希算法的实现非常重要。

常见的哈希算法：

||MD5|SHA-1|SHA-2|SHA-3|
|:--:|:--:|:--:|:--:|:--:|
|输出长度|128 bit|160 bit|256/512 bit|224/256/384/512 bit|
|哈希冲突|较多|较多|很少|很少|
|安全等级|低，已被成功攻击|低，已被成功攻击|高|高|
|应用|已被弃用，仍用于数据完整性检查|已被弃用|加密货币交易验证、数字签名等|可用于替代 SHA-2|

---

# 引用

- [Hello算法 哈希表](https://www.hello-algo.com/chapter_hashing/)
