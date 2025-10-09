# 堆（heap）

## 特征

1. 最底层节点靠左填充，其他层的节点都被填满（是一棵完全二叉树）
2. 将二叉树的根节点称为“堆顶”，将底层最靠右的节点称为“堆底”
3. 对于大顶堆（小顶堆），堆顶元素（根节点）的值是最大（最小）的

    1. 小顶堆（min heap）：任意节点的值 ≤ 其子节点的值
    2. 大顶堆（max heap）：任意节点的值 ≥ 其子节点的值

## 示例代码

```cpp showLineNumbers
template <typename T, typename _Compare = std::less<int>>
class heap {
public:
    heap() {}
    heap(const std::vector<T>& data) {
        m_data = data;
        for (int i = 1; i < m_data.size(); ++i) {
            T val = m_data[i];
            int parent = (i - 1) / 2;
            while (i > 0 && m_compare(m_data[parent], val)) {
                m_data[i] = m_data[parent];
                i = parent;
                parent = (i - 1) / 2;
            }
            m_data[i] = val;
        }
    }
    ~heap() {}

    void push(const T& val) {
        m_data.push_back(val);
        push_heap(val);
    }

    void pop() {
        pop_heap();
        m_data.pop_back();
    }

    T& top() {
        return m_data.front();
    }

    bool empty() const {
        return m_data.empty();
    }

    void print() const {
        for (auto&& val: m_data) {
            std::cout << val << ",";
        }
        std::cout << std::endl;
    }

private:
    void push_heap(const T& val) {
        int hole = m_data.size() - 1;
        int parent = (hole - 1) / 2;
        while (hole > 0 && m_compare(m_data[parent], val)) {
            m_data[hole] = m_data[parent];
            hole = parent;
            parent = (hole - 1) / 2;
        }
        m_data[hole] = val;
    }

    void pop_heap() {
        T val = m_data.back();
        int size = m_data.size() - 1;
        int hole = 0;
        while (hole <= (size - 1) / 2) {
            int left = (hole + 1) * 2 - 1, right = (hole + 1) * 2;
            if (right < size && m_compare(m_data[left], m_data[right])) {
                if (m_compare(val, m_data[right])) {
                    m_data[hole] = m_data[right];
                    hole = right;
                } else break;
            } else {
                if (m_compare(val, m_data[left])) {
                    m_data[hole] = m_data[left];
                    hole = left;
                } else break;
            }
        }
        m_data[hole] = val;
    }

private:
    std::vector<T> m_data;
    _Compare m_compare;
};
```

## 常见应用

- 优先队列，例如 C++ 中的 priority_queue
- 堆排序，可以针对数组做原地排序
- 获取最大的 k 个元素

## Top-k 问题

- 方法 1：遍历选择
- 方法 2：先排序，后返回
- 方法 3：利用堆结构
    1. 初始化一个小顶堆
    2. 先将数组前`k`个元素依次入堆
    3. 从第`k + 1`个元素开始，若当前元素大于堆顶元素，则将堆顶元素出堆，并将当前元素入堆
    4. 遍历完成后，堆中保存的就是最大的`k`个元素

### 利用堆的示例代码

```cpp showLineNumbers
std::vector<int> top_k(const std::vector<int>& data, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    for (int i = 0; i < k; ++i) {
        heap.push(data[i]);
    }
    for (int i = k; i < data.size(); ++i) {
        if (data[i] > heap.top()) {
            heap.pop();
            heap.push(data[i]);
        }
    }

    std::vector<int> res;
    for (int i = 0; i < k; ++i) {
        res.push_back(heap.top());
        heap.pop();
    }
    return res;
}
```
