# 回溯

## 全排列问题

### 原数据不含重复元素

> #### 问题描述
> 
> 输入一个整数数组，其中不包含重复元素，返回所有可能的排列。

```cpp showLineNumbers
std::vector<std::vector<int>> permutations(std::vector<int>& nums) {
    std::function<void(std::vector<int>&, std::vector<int>&, std::vector<bool>&, std::vector<std::vector<int>>&)> _backtrack;
    _backtrack = [&self=_backtrack](
        std::vector<int>& state, std::vector<int>& choices, 
        std::vector<bool>& visited, std::vector<std::vector<int>>& res
    ) {
        // 终止条件
        if (state.size() == choices.size()) {
            res.push_back(state);
            return;
        }

        // 遍历所有选择
        for (int i = 0; i < choices.size(); ++i) {
            // 剪枝：不允许重复选择元素
            if (!visited[i]) {
                // 选择该数据
                visited[i] = true;
                state.push_back(choices[i]);
                // 选择后续的数字
                self(state, choices, visited, res);
                // 回退该数据的选择
                state.pop_back();
                visited[i] = false;
            }
        }
    };

    std::vector<int> state;
    std::vector<bool> visited(nums.size(), false);
    std::vector<std::vector<int>> res;
    _backtrack(state, nums, visited, res);
    return res;
}
```

### 原数据含重复元素

> #### 问题描述
> 
> 输入一个整数数组，数组中可能包含重复元素，返回所有不重复的排列。

```cpp showLineNumbers
std::vector<std::vector<int>> permutations(std::vector<int>& nums) {
    std::function<void(std::vector<int>&, std::vector<int>&, std::vector<bool>&, std::vector<std::vector<int>>&)> _backtrack;
    _backtrack = [&self=_backtrack](
        std::vector<int>& state, std::vector<int>& choices, 
        std::vector<bool>& visited, std::vector<std::vector<int>>& res
    ) {
        // 终止条件
        if (state.size() == choices.size()) {
            res.push_back(state);
            return;
        }

        // 遍历所有选择
        std::unordered_set<int> duplicated;
        for (int i = 0; i < choices.size(); ++i) {
            // 剪枝：不允许重复选择元素且不能重复选择相等元素
            if (!visited[i] && duplicated.find(choices[i]) == duplicated.end()) {
                // 选择该数据
                duplicated.emplace(choices[i]);
                visited[i] = true;
                state.push_back(choices[i]);
                // 选择后续的数字
                self(state, choices, visited, res);
                // 回退该数据的选择
                state.pop_back();
                visited[i] = false;
            }
        }
    };

    std::vector<int> state;
    std::vector<bool> visited(nums.size(), false);
    std::vector<std::vector<int>> res;
    _backtrack(state, nums, visited, res);
    return res;
}
```

---

## 子集和问题

### 原数据不含重复元素

> #### 问题描述
> 
> 给定一个正整数数组 `nums` 和一个目标正整数 `target` ，请找出所有可能的组合，使得组合中的元素和等于 `target` 。给定数组无重复元素，每个元素可以被选取多次。请以列表形式返回这些组合，列表中不应包含重复组合。

```cpp showLineNumbers
std::vector<std::vector<int>> subset_sum1(std::vector<int>& nums, int target) {
    std::function<void(std::vector<int>&, int, std::vector<int>&, int, std::vector<std::vector<int>>&)> _backtrack;
    _backtrack = [&self=_backtrack](
        std::vector<int>& state, int target, 
        std::vector<int>& choices, int start, std::vector<std::vector<int>>& res
    ) {
        // 终止条件
        if (target == 0) {
            res.push_back(state);
            return;
        }

        // 遍历所有选择
        for (int i = start; i < choices.size(); ++i) {
            // 超过剩余目标数直接跳过后续元素，因为原数据为有序数据
            if (choices[i] > target) {
                break;
            }
            // 选择该数据
            state.push_back(choices[i]);
            // 选择后续的数字
            self(state, target - choices[i], choices, i, res);
            // 回退该数据的选择
            state.pop_back();
        }
    };

    std::vector<int> state;
    std::vector<std::vector<int>> res;
    _backtrack(state, target, nums, 0, res);
    return res;
}
```

### 原数据含重复元素

> #### 问题描述
> 
> 给定一个正整数数组 `nums` 和一个目标正整数 `target` ，请找出所有可能的组合，使得组合中的元素和等于 `target` 。给定数组可能包含重复元素，每个元素只可被选择一次。请以列表形式返回这些组合，列表中不应包含重复组合。

```cpp showLineNumbers
std::vector<std::vector<int>> subset_sum1(std::vector<int>& nums, int target) {
    std::function<void(std::vector<int>&, int, std::vector<int>&, int, std::vector<std::vector<int>>&)> _backtrack;
    _backtrack = [&self=_backtrack](
        std::vector<int>& state, int target, 
        std::vector<int>& choices, int start, std::vector<std::vector<int>>& res
    ) {
        // 终止条件
        if (target == 0) {
            res.push_back(state);
            return;
        }

        // 遍历所有选择
        for (int i = start; i < choices.size(); ++i) {
            // 超过剩余目标数直接跳过后续元素，因为原数据为有序数据
            if (choices[i] > target) {
                break;
            }
            if (i > start && choices[i] == choices[i - 1]) {
                continue; // 当前元素重复，跳过当前元素
            }
            // 选择该数据
            state.push_back(choices[i]);
            // 选择后续的数字
            self(state, target - choices[i], choices, i, res);
            // 回退该数据的选择
            state.pop_back();
        }
    };

    std::vector<int> state;
    std::vector<std::vector<int>> res;
    _backtrack(state, target, nums, 0, res);
    return res;
}
```

---

## N 皇后问题

> ### 问题描述
> 
> 根据国际象棋的规则，皇后可以攻击与同处一行、一列或一条斜线上的棋子。给定 `n` 个皇后和一个 `n` 大小的棋盘，寻找使得所有皇后之间无法相互攻击的摆放方案。

```cpp showLineNumbers
std::vector<std::vector<std::vector<bool>>> n_queens(int n) {
    std::function<void(
        std::vector<std::vector<bool>>&, int, int, 
        std::vector<std::vector<std::vector<bool>>>&, 
        std::vector<bool>&, std::vector<bool>&, std::vector<bool>&)
    > _backtrack;
    _backtrack = [&self=_backtrack](
        std::vector<std::vector<bool>>& state, int n, int row, 
        std::vector<std::vector<std::vector<bool>>>& res,
        std::vector<bool>& cols, // 每一列是否包含 queen
        std::vector<bool>& diags1, // 每一条正对角线是否包含 queen
        std::vector<bool>& diags2 // 每一条反对角线是否包含 queen
    ) {
        // 终止条件
        if (row == n) {
            res.push_back(state);
            return;
        }
        // 遍历该行所有位置
        for (int col = 0; col < n; ++col) {
            // 判断当前位置是否可以放置
            int diag1 = row - col + n - 1;
            int diag2 = row + col;
            if (cols[col] || diags1[diag1] || diags2[diag2]) {
                continue;
            }
            // 选择该数据
            state[row][col] = true;
            cols[col] = diags1[diag1] = diags2[diag2] = true;
            // 选择后续的数字
            self(state, n, row + 1, res, cols, diags1, diags2);
            // 回退该数据的选择
            state[row][col] = false;
            cols[col] = diags1[diag1] = diags2[diag2] = false;
        }
    };

    std::vector<std::vector<bool>> state(n, std::vector<bool>(n, false));
    std::vector<std::vector<std::vector<bool>>> res;
    std::vector<bool> cols(n);
    std::vector<bool> diags1(n * 2 - 1);
    std::vector<bool> diags2(n * 2 - 1);
    _backtrack(state, n, 0, res, cols, diags1, diags2);
    return res;
}
```