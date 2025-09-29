# 无锁队列的实现

无锁队列（Lock-Free Queue）是一种不使用锁机制（如：互斥锁、读写锁）来实现线程安全的队列，是 Lock-Free 中基础的数据结构。

通过复杂的原子操作（如：CAS 操作）来确保多线程环境下的正确性和一致性。在高并发场景下，避免因锁机制带来的性能开销和潜在的死锁问题。

在无锁队列中，需要从以下几个方面对整体流程进行思考（需要均做到没有问题）：

    1. 至少两个入队操作同时继续，队列无数据时如何处理？
    2. 至少两个入队操作同时继续，队列有数据时如何处理？
    3. 至少两个出队操作同时继续，队列有一个数据时如何处理？（针对链表方式）
    4. 至少两个出队操作同时继续，队列有超过一个数据时如何处理？
    5. 至少一个入队操作、一个出队操作同时进行，队列无数据时如何处理？
    6. 至少一个入队操作、一个出队操作同时进行，队列有一个数据时如何处理？（针对链表方式）
    7. 至少一个入队操作、一个出队操作同时进行，队列有超过一个数据时如何处理？


## 基于数组的无锁队列

### 多生产者，多消费者场景

```cpp showLineNumbers
template <typename T>
class safe_queue {
public:
    safe_queue(int size): m_size(size + 1) {
        m_buffer = static_cast<T*>(::malloc(m_size * sizeof(T)));
    }
    ~safe_queue() {
        ::free(m_buffer);
    }

    int size() { return m_size - 1; }
    bool empty() { return m_head == m_tail; }
    bool full() { return (m_tail + 1) % m_size == m_head; }

    bool enqueue(const T& item) {
        int head = 0, enqueue_tail = 0, enqueue_pos = 0;
        // 先占用一个写入位置
        do {
            head = m_head;
            enqueue_tail = m_enqueue_tail;
            enqueue_pos = (enqueue_tail + 1) % m_size;
            if (enqueue_pos == head) {
                return false; // 队列已满
            }
        } while (!m_enqueue_tail.compare_exchange_weak(enqueue_tail, enqueue_pos));
        // 实际写入数据
        m_buffer[enqueue_tail] = item;
        // 更新有效数据结尾 tail
        while (!m_tail.compare_exchange_weak(enqueue_tail, enqueue_pos)) {
            // 先占用的位置与 m_tail 不相等，需要先等其他线程完成操作（更新 m_tail），再进行当前操作
            std::cout << "enqueue yield" << std::endl;
            std::this_thread::yield(); // 但是频繁切换线程会导致 cache 颠簸
        }
        return true;
    }

    bool dequeue(T& item) {
        int dequeue_head = 0, new_head = 0, tail = 0;
        // 更新新的头部位置
        do {
            dequeue_head = m_dequeue_head;
            new_head = (dequeue_head + 1) % m_size;
            tail = m_tail;
            if (dequeue_head == tail) {
                return false; // 队列是空的
            }
        } while (!m_dequeue_head.compare_exchange_weak(dequeue_head, new_head));
        // 实际取出数据
        item = m_buffer[dequeue_head];
        // 更新有效数据头部 head
        while (!m_head.compare_exchange_weak(dequeue_head, new_head)) {
            // 头部位置与新更新的位置不相等，需要等其他线程完成操作（更新 m_head），再进行当前操作
            std::cout << "dequeue yield" << std::endl;
            std::this_thread::yield();
        }
        return true;
    }

private:
    T* m_buffer = nullptr;
    int m_size{0};
    std::atomic_int m_head{0};
    std::atomic_int m_dequeue_head{0}; // 用于出队时记录新的头部位置，适合多消费者
    std::atomic_int m_tail{0};
    std::atomic_int m_enqueue_tail{0}; // 用于入队占用待写入空间，适合多生产者
};
```

上述代码中 dequeue 也可采用以下逻辑，优点为可以省略 m_dequeue_head 原子变量，缺点为元素可能会造成多次拷贝，降低执行效率

```cpp showLineNumbers
bool dequeue(T& item) {
    int head = 0;
    do {
        head = m_head;
        if (head == m_tail) {
            return false; // 队列是空的
        }
        item = m_buffer[head]; // 每次都会拷贝一下元素，降低效率
    } while(!m_head.compare_exchange_weak(head, (head + 1) % m_size));
    return true;
}
```

### 单生产者，多消费者  

在单生产者情况下，无需对头部索引做特殊处理，仅修改 enqueue 函数即可。

因为没有多线程竞争，所以仅修改 m_tail 即可，不需要 m_enqueue_tail 变量。

```cpp showLineNumbers
bool enqueue(const T& item) {
    if ((m_tail + 1) % m_size == m_head) {
        return false; // 队列已满
    }
    m_buffer[m_tail] = item;
    m_tail = (m_tail + 1) % m_size;
    return true;
}
```

### 多生产者，单消费者

在单消费者情况下，无需对尾部索引做特殊处理，仅修改 dequeue 函数即可。

因为没有多线程竞争，所以仅修改 m_head 即可，不需要 m_dequeue_head。

```cpp showLineNumbers
bool dequeue(T& item) {
    if (m_head == m_tail) {
        return false; // 队列是空的
    }
    item = m_buffer[m_head];
    m_head = (m_head + 1) % m_size;
    return true;
}
```

---

## 基于链表的无锁队列

```cpp showLineNumbers
template <typename T>
class safe_queue {
public:
    struct node_type {
        node_type* next;
        T val;
    };
    static node_type* null_node;

    safe_queue() {}
    ~safe_queue() {}

    bool empty() { return m_head == nullptr; }

    bool enqueue(const T& item) {
        node_type* node = static_cast<node_type*>(::malloc(sizeof(node_type)));
        node->val = item;
        node->next = nullptr;
        for(;;) {
            node_type* tail = m_tail;
            if (tail == nullptr) { // 空链表
                if (m_head.compare_exchange_weak(null_node, node)) {
                    m_tail = node; // 由于先 CAS 更新 m_head，所以后续更新 m_tail 安全，但对出队可能有影响
                    return true;
                }
            } else { // 链表不为空，不需要更新 m_head
                if (m_tail.compare_exchange_weak(tail, node)) {
                    tail->next = node; // 此处更新原始结尾的下一个节点可能会影响到出队时的判断，出队需要避免该问题
                    return true;
                }
            }
        }
    }

    bool dequeue(T& item) {
        node_type* node = nullptr;
        for (;;) {
            node_type* head = m_head;
            node_type* tail = m_tail;
            if (head == nullptr) {
                return false;
            }
            if (head == tail) { // 仅有一个节点，需要先更新 m_tail，防止入队先使用 m_tail
                if (m_tail.compare_exchange_weak(tail, null_node)) {
                    m_head = nullptr;
                    node = head;
                    break;
                }
            } else { // 超过一个节点
                // 必须确保 next 不为空，防止入队操作正在进行
                node_type* next = head->next;
                if (next != nullptr && m_head.compare_exchange_weak(head, next)) {
                    node = head;
                    break;
                }
            }
        };
        item = node->val;
        ::free(node);
        return true;
    }

private:
    std::atomic<node_type*> m_head = nullptr;
    std::atomic<node_type*> m_tail = nullptr;
};

template <typename T>
typename safe_queue<T>::node_type* safe_queue<T>::null_node = nullptr;
```

## 引用

- [基于数组的无锁队列](https://www.cnblogs.com/sniperHW/p/4172248.html)
- [基于链表的无锁队列](https://www.cnblogs.com/takumicx/p/9496856.html)
