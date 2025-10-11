# 排序

常见排序算法有：选择排序、冒泡排序、插入排序、快速排序、归并排序、堆排序、桶排序、计数排序、基数排序等

## 选择排序

遍历数组，每轮遍历时从未排序区域选择最小的元素，将其放到已排序区域的结尾

### 示例代码

```cpp showLineNumbers
void selection_sort(std::vector<int>& data) {
    for (int i = 0; i < data.size() - 1; ++i) {
        int min_idx = i;
        for (int j = i + 1; j < data.size(); ++j) {
            if (data[min_idx] > data[j]) {
                min_idx = j;
            }
        }
        std::swap(data[i], data[min_idx]);
    }
}
```

### 算法特性

- 时间复杂度为 $O(n^2)$、非自适应排序
- 空间复杂度为 $O(1)$、原地排序
- 非稳定排序

---

## 冒泡排序

通过连续的比较与交换相邻元素实现排序

### 示例代码

```cpp showLineNumbers
void bubble_sort(std::vector<int>& data) {
    bool flag = false;
    for (int i = data.size() - 1; i > 0; --i) {
        for (int j = 0; j < i; ++j) {
            if (data[j] > data[j+1]) {
                std::swap(data[j], data[j+1]);
                flag = true;
            }
        }
        if (flag == false) { // 本次轮询完全无交换
            break;
        }
    }
}
```

### 算法特性

- 时间复杂度为 $O(n^2)$、自适应排序：在引入 `flag` 的情况下，时间复杂度可达到 $O(n)$
- 空间复杂度为 $O(1)$、原地排序
- 稳定排序

---

## 插入排序

在未排序区间选择一个基准元素，将该元素与其左侧已排序区域间的元素逐一比较，并将该元素插入到合适的位置

### 示例代码

```cpp showLineNumbers
void insertion_sort(std::vector<int>& data) {
    for (int i = 1; i < data.size(); ++i) {
        int val = data[i];
        int j = i - 1;
        while (j >= 0 && data[j] > val) {
            data[j + 1] = data[j];
            --j;
        }
        data[j + 1] = val;
    }
}
```

### 算法特性

- 时间复杂度为 $O(n^2)$、自适应排序：在遇到有序数据时，插入操作会提前终止；在输入数据完全有序时，时间复杂度可以达到 $O(n)$
- 空间复杂度为 $O(1)$、原地排序
- 稳定排序
- 相较于冒泡排序，拥有更少的元素操作，计算开销更小

---

## 快速排序

选择数组中的某个元素作为“基准数”，将所有小于基准数的元素移到其左侧，而大于基准数的元素移到其右侧

### 示例代码

```cpp showLineNumbers
void quick_sort(std::vector<int>& data) {
    auto _partition = [](std::vector<int>& data, int left, int right) {
        int i = left, j = right;
        while (i < j) {
            while (i < j && data[j] >= data[left]) --j;
            while (i < j && data[i] <= data[left]) ++i;
            std::swap(data[i], data[j]);
        }
        std::swap(data[i], data[left]);
        return i;
    };
    std::function<void(std::vector<int>&, int, int)> _quick_sort;
    _quick_sort = [&self=_quick_sort, &_partition](std::vector<int>& data, int left, int right) {
        if (left >= right) {
            return;
        }
        int pivot = _partition(data, left, right);
        self(data, left, pivot - 1);
        self(data, pivot + 1, right);
    };
    _quick_sort(data, 0, data.size() - 1);
}
```

### 基准数优化

尽量选择靠中间的元素作为基准数，这样可以减少左右数组的极端情况；

- 方法一：直接选择中间位置上的元素。在数据有序情况下，实测可提升 20 倍
    > 在循环前增加以下代码将基准数移动至最左侧
    ```cpp
    std::swap(data[left], data[(left + right) / 2])
    ```

- 方法二：分别对比最左、中间、最右的中位数，示例代码如下：
    ```cpp showLineNumbers
    auto _select_base = [](std::vector<int>& data, int left, int right) -> int {
        int mid = (left + right) / 2;
        if (data[left] <= data[mid] && data[mid] >= data[right]) {
            return mid;
        }
        if (data[mid] <= data[left] && data[left] >= data[right]) {
            return left;
        }
        return right;
    };
    ```
    > 在循环前增加以下代码并将基准数移动至最左侧
    ```cpp
    int base = _select_base(data, left, right);
    std::swap(data[left], data[base]);
    ```

### 递归深度优化

通过循环判断减少递归的深度，防止栈帧空间占用过多，在同一层尽可能多的调用自身，示例代码如下：

```cpp showLineNumbers
_quick_sort = [&self=_quick_sort, &_partition](std::vector<int>& data, int left, int right) {
    while (left < right) { // 在循环中调用自身多次，不断拆分较长的一段
        int pivot = _partition(data, left, right);
        if (pivot - left < right - pivot) { // 左侧较短
            self(data, left, pivot - 1);
            left = pivot + 1;
        } else { // 右侧较短
            self(data, pivot + 1, right);
            right = pivot - 1;
        }
    }
};
```

### 算法特性

- 时间复杂度为 $O(n\log(n))$、非自适应排序：最坏情况下每层都分为 `0` 和 `n-1` 两个子数组，递归层数达到 `n`，每层循环为 `n`，时间复杂度为 $O(n^2)$
- 空间复杂度为 $O(\log(n))$、原地排序
- 非稳定排序

---

## 归并排序

基于分治策略，对数据先进行划分处理，再进行合并

1. 划分阶段：通过递归不断的将数组从中点处分开，将长数组的排序问题转换为短数组的排序问题
2. 合并阶段：当子数组长度为 1 时终止划分，开始合并，持续的将左右两个有序的较短数组合并为一个有序的较长数组

### 示例代码

```cpp showLineNumbers
void merge_sort(std::vector<int>& data) {
    auto _merge = [](std::vector<int>& data, int left, int mid, int right) {
        std::vector<int> tmp;
        tmp.reserve(right - left + 1);
        int i = left, j = mid + 1;
        while (i <= mid && j <= right) {
            if (data[i] <= data[j]) {
                tmp.push_back(data[i++]);
            } else {
                tmp.push_back(data[j++]);
            }
        }
        while (i <= mid) tmp.push_back(data[i++]);
        while (j <= right) tmp.push_back(data[j++]);
        for (int k = 0; k < tmp.size(); ++k) {
            data[left + k] = tmp[k];
        }
    };
    std::function<void(std::vector<int>&, int, int)> _merge_sort;
    _merge_sort = [&self=_merge_sort, _merge](std::vector<int>& data, int left, int right) {
        if (left >= right) {
            return;
        }
        // 划分阶段
        int mid = (left + right) / 2;
        self(data, left, mid);
        self(data, mid + 1, right);
        // 合并阶段
        _merge(data, left, mid, right);
    };
    _merge_sort(data, 0, data.size() - 1);
}
```

### 算法特性

- 时间复杂度为 $O(n\log(n))$、非自适应排序
- 空间复杂度为 $O(n)$、非原地排序
- 稳定排序

---

## 堆排序

基于“堆”数据结构实现的排序算法。先构建堆、然后不断执行出堆操作即可，可以基于原数组执行出堆操作（不断放入结尾并更新结尾位置）

### 示例代码

```cpp showLineNumbers
void heap_sort(std::vector<int>& data) {
    // 向下堆化
    auto _sift_down = [](std::vector<int>& data, int size, int target) {
        while (true) {
            int i = target;
            int l = (i + 1) * 2 - 1, r = (i + 1) * 2;
            if (l < size && data[l] > data[i]) i = l;
            if (r < size && data[r] > data[i]) i = r;
            if (i == target) break;
            std::swap(data[i], data[target]);
            target = i;
        }
    };

    // 构建最大堆
    for (int i = (data.size() - 2) / 2; i >= 0; --i) {
        _sift_down(data, data.size(), i);
    }

    // 不断取出元素
    for (int i = data.size() - 1; i > 0; --i) {
        std::swap(data[0], data[i]);
        _sift_down(data, i, 0); // 对根节点进行向下堆化
    }
}
```

### 算法特性

- 时间复杂度为 $O(n\log(n))$、非自适应排序
- 空间复杂度为 $O(1)$、原地排序
- 非稳定排序

---

## 桶排序

设置一些具有大小顺序的桶，每个桶对应一个数据范围，将数据平均分配到各个桶中；然后在每个桶内部分别执行排序；最终按照桶的顺序将所有数据合并

### 示例代码

```cpp showLineNumbers
void bucket_sort(std::vector<int>& data) {
    // 取得数据最大最小值
    int min = std::numeric_limits<int>::max();
    int max = std::numeric_limits<int>::min();
    for (auto&& val: data) {
        if (min > val) min = val;
        if (max < val) max = val;
    }
    int size = (max - min) / data.size() + 1; // 每个桶能放的数据范围，+1 保证至少有一个桶
    int count = (max - min) / size + 1; // 需要多少个桶，+1 保证至少有一个桶

    std::vector<std::vector<int>> buckets(count);
    for (auto&& val: data) {
        buckets[(val - min) / size].push_back(val);
    }
    // 桶内排序
    for (auto&& bucket: buckets) {
        std::sort(bucket.begin(), bucket.end()); // 内部的排序算法
    }
    // 合并各个桶数据
    int index = 0;
    for (auto&& bucket: buckets) {
        for (auto&& val: bucket) {
            data[index++] = val;
        }
    }
}
```

### 算法特性

- 时间复杂度为 $O(n+k)$、非自适应排序：最差情况下，所有数据被分配到一个桶中，则完全取决于内部使用的排序算法
- 空间复杂度为 $O(n+k)$、非原地排序
- 是否稳定排序：取决于内部的排序算法

---

## 计数排序

通过统计元素数量实现排序，通常应用于有范围的整数数组

### 示例代码

#### 方法一：计数器仅记录个数

```cpp showLineNumbers
void counting_sort(std::vector<int>& data) {
    int min = std::numeric_limits<int>::max();
    int max = std::numeric_limits<int>::min();
    for (auto&& val: data) {
        if (min > val) min = val;
        if (max < val) max = val;
    }

    std::vector<int> counter(max - min + 1, 0);
    for (auto&& val: data) {
        counter[val - min]++;
    }

    int index = 0;
    for (int i = 0; i < counter.size(); ++i) {
        for (int j = 0; j < counter[i]; ++j) {
            data[index++] = min + i;
        }
    }
}
```

#### 方法二：计数器记录索引

```cpp showLineNumbers
void counting_sort(std::vector<int>& data) {
    int min = std::numeric_limits<int>::max();
    int max = std::numeric_limits<int>::min();
    for (auto&& val: data) {
        if (min > val) min = val;
        if (max < val) max = val;
    }

    std::vector<int> counter(max - min + 1, 0);
    for (auto&& val: data) {
        counter[val - min]++;
    }
    for (int i = 1; i < counter.size(); ++i) {
        counter[i] += counter[i-1];
    }
    int index = 0;
    std::vector<int> tmp(data.size());
    for (int i = data.size() - 1; i >= 0; --i) {
        tmp[--counter[data[i] - min]] = data[i];
    }
    data.swap(tmp);
}
```

### 算法特性

- 时间复杂度为 $O(n+m)$、非自适应排序
- 空间复杂度为 $O(n+m)$、非原地排序
- 稳定排序

---

## 基数排序

针对数字各位之间的递进关系，依次对每一位进行排序，从而得到最终的排序结果

### 示例代码

#### 方法一：基于桶排序

```cpp showLineNumbers
void radix_sort(std::vector<int>& data) {
    int max = std::numeric_limits<int>::min();
    for (auto&& val: data) {
        if (max < val) max = val;
    }
    auto _bucket_sort = [](std::vector<int>& data, int exp) {
        std::vector<std::vector<int>> buckets(10);
        for (auto&& val: data) {
            buckets[(val / exp) % 10].push_back(val);
        }
        int index = 0;
        for (auto&& bucket: buckets) {
            for (auto&& val: bucket) {
                data[index++] = val;
            }
        }
    };
    for (int exp = 1; exp <= max; exp *= 10) {
        _bucket_sort(data, exp);
    }
}
```

#### 方法二：基于计数排序（网络中使用该方法较多）

```cpp showLineNumbers
void radix_sort(std::vector<int>& data) {
    int max = std::numeric_limits<int>::min();
    for (auto&& val: data) {
        if (max < val) max = val;
    }
    auto _counting_sort = [](std::vector<int>& data, int exp) {
        std::vector<int> counter(10);
        for (auto&& val: data) {
            counter[(val / exp) % 10]++;
        }
        for (int i = 1; i < counter.size(); ++i) {
            counter[i] += counter[i-1];
        }
        int index = 0;
        std::vector<int> tmp(data.size());
        for (int i = data.size() - 1; i >= 0; --i) {
            tmp[--counter[(data[i] / exp) % 10]] = data[i];
        }
        data.swap(tmp);
    };
    for (int exp = 1; exp <= max; exp *= 10) {
        _counting_sort(data, exp);
    }
}
```

### 算法特性

- 时间复杂度为 $O(nm)$、非自适应排序：`m` 表示桶或计数器的个数，一般为 `10`
- 空间复杂度为 $O(n+m)$、非原地排序
- 稳定排序
- 涉及负数的排序需要额外做处理

---

## 总结

||最佳（时间复杂度）|平均（时间复杂度）|最差（时间复杂度）|最差（空间复杂度）|稳定性|原地性|自适应性|基于比较|
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|选择排序|$O(n^2)$|$O(n^2)$|$O(n^2)$|$O(1)$|非稳定|原地|非自适应|比较|
|冒泡排序|$O(n)$|$O(n^2)$|$O(n^2)$|$O(1)$|稳定|原地|自适应|比较|
|插入排序|$O(n)$|$O(n^2)$|$O(n^2)$|$O(1)$|稳定|原地|自适应|比较|
|快速排序|$O(n\log(n))$|$O(n\log(n))$|$O(n^2)$|$O(\log(n))$|非稳定|原地|非自适应|比较|
|归并排序|$O(n\log(n))$|$O(n\log(n))$|$O(n\log(n))$|$O(n)$|稳定|非原地|非自适应|比较|
|堆排序|$O(n\log(n))$|$O(n\log(n))$|$O(n\log(n))$|$O(1)$|非稳定|原地|非自适应|比较|
|桶排序|$O(n)$|$O(n)$|$O(n^2)$|$O(n+k)$|稳定|非原地|非自适应|非比较|
|计数排序|$O(n+m)$|$O(n+m)$|$O(n+m)$|$O(n+m)$|稳定|非原地|非自适应|非比较|
|基数排序|$O(nm)$|$O(nm)$|$O(nm)$|$O(n+m)$|稳定|非原地|非自适应|非比较|
