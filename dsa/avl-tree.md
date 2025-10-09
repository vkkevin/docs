# AVL 树（平衡二叉搜索树）

## 特征

1. 对于根节点，左子树所有节点的值 < 根节点的值 < 右子树中所有节点的值
2. 任意节点左、右子树也是二叉搜索树，即同样满足特征 1
3. 任意节点左、右子树的高度差的绝对值不超过 1

---

## 示例代码

```cpp showLineNumbers
template <typename T>
class avl_tree { // bbs_tree
public:
    struct node_type {
        T val{};
        int height = 0;
        node_type* parent = nullptr;
        node_type* left = nullptr;
        node_type* right = nullptr;

        node_type(node_type* _parent, const T& _val): parent(_parent), val(_val) {} 
    };

    avl_tree() {}
    ~avl_tree() { clear(); }
    avl_tree(avl_tree&& other): m_root(std::exchange(other.m_root, nullptr)) {}

    avl_tree& operator=(avl_tree&& other) {
        m_root = std::exchange(other.m_root, nullptr);
    }

    void insert(const T& val) {
        if (m_root == nullptr) {
            m_root = new node_type(nullptr, val);
            return;
        }

        auto [parent, node] = find_helper(val);
        if (node != nullptr) {
            return;
        }

        node = new node_type(parent, val);
        assert(parent != nullptr && parent->val != val);
        if (parent->val > val) {
            parent->left = node;
        } else {
            parent->right = node;
        }

        update_heights(parent);
        rebalance(parent);
    }

    void remove(const T& val) {
        auto [_, node] = find_helper(val);
        if (node == nullptr) {
            return;
        }

        node_type* new_node = nullptr;
        if (get_balance_factor(node) > 0) {
            new_node = node->left;
            while (new_node->right) {
                new_node = new_node->right;
            }
        } else { // get_balance_factor(node) <= 0
            new_node = node->right;
            while (new_node && new_node->left) {
                new_node = new_node->left;
            }
        }

        node_type* update_node = nullptr;
        if (new_node) {
            update_node = new_node->parent == node ? new_node : new_node->parent;

            if (new_node == new_node->parent->left) {
                new_node->parent->left = nullptr;
            } else {
                new_node->parent->right = nullptr;
            }
            new_node->parent = node->parent;
            new_node->left = node->left;
            if (node->left) {
                node->left->parent = new_node;
            }
            new_node->right = node->right;
            if (node->right) {
                node->right->parent = new_node;
            }
        } else {
            update_node = node->parent;
        }
        if (node == m_root) {
            m_root = new_node;
        } else if (node == node->parent->left) {
            node->parent->left = new_node;
        } else {
            node->parent->right = new_node;
        }
        delete node;

        if (update_node) {
            update_heights(update_node);
            rebalance(update_node);
        }
    }

    bool find(const T& val) const {
        return find_helper(val).second;
    }

    void clear() {
        std::function<void(node_type*)> _clear;
        _clear = [&self=_clear](node_type* node) {
            while (node) {
                self(node->right);
                node_type* left = node->left;
                delete node;
                node = left;
            }
        };
        _clear(m_root);
    }

    bool check() const {
        // 校验是否有序
        auto check_order = [](node_type* node) -> bool {
            struct res_type {
                bool res;
                T min_val;
                T max_val;
            };
            std::function<res_type(node_type*)> _check_order;
            _check_order = [&self=_check_order](node_type* node) -> res_type {
                res_type res = {true, node->val, node->val};
                if (node->left) {
                    res_type left_res = self(node->left);
                    if (left_res.res == false || node->val < left_res.max_val) {
                        return {false, node->val, node->val};
                    }
                    res.min_val = left_res.min_val;
                }
                if (node->right) {
                    res_type right_res = self(node->right);
                    if (right_res.res == false || node->val > right_res.min_val) {
                        return {false, node->val, node->val};
                    }
                    res.max_val = right_res.max_val;
                }
                return res;
            };
            return _check_order(node).res;
        };

        // 校验高度是否正确且是否平衡
        std::function<bool(node_type*)> check_balance;
        check_balance = [this, &self=check_balance](node_type* node) -> bool {
            if (node->left == nullptr && node->right == nullptr) {
                return node->height == 0;
            }
            int balance_factor = get_balance_factor(node);
            bool res = (balance_factor >= -1 && balance_factor <= 1);
            if (node->left) {
                res = res && self(node->left);
            }
            if (node->right) {
                res = res && self(node->right);
            }
            return res;
        };

        return (m_root == nullptr) || (check_order(m_root) && check_balance(m_root));
    }

    // https://ggorlen.github.io/prettybt/
    void print() const {
        int max_node_count = m_root ? (1<<(m_root->height+1))-1 : 0;
        std::vector<node_type*> nodes;
        nodes.reserve(max_node_count);
        nodes.push_back(m_root);
        for (int i = 0; i < max_node_count; ++i) {
            if (nodes[i]) {
                nodes.push_back(nodes[i]->left);
                nodes.push_back(nodes[i]->right);
            } else {
                nodes.push_back(nullptr);
                nodes.push_back(nullptr);
            }
        }
        std::cout << "\n[";
        for (int i = 0; i < max_node_count; ++i) {
            if (i != 0) {
                std::cout << ",";
            }
            if (nodes[i]) {
                std::cout << nodes[i]->val;
            }
        }
        std::cout << "]\n";
    }

private:
    std::pair<node_type*, node_type*> find_helper(const T& val) const {
        node_type* parent = nullptr;
        node_type* cur = m_root;
        while (cur) {
            if (cur->val == val) {
                return {parent, cur};
            }
            parent = cur;
            cur = cur->val < val ? cur->right : cur->left;
        }
        return {parent, nullptr};
    }

    int get_height(node_type* node) const {
        return node ? node->height : -1;
    }

    void update_heights(node_type* node) {
        while (node) {
            node->height = std::max(get_height(node->left), get_height(node->right)) + 1;
            node = node->parent;
        }
    }

    int get_balance_factor(node_type* node) const {
        if (node) {
            return get_height(node->left) - get_height(node->right);
        }
        return 0;
    }

    // 左旋：表示右子树比左子树高，会将右孩子的左子树挂载在局部根节点的右子树，并将右孩子提升为局部根节点
    void left_rotate(node_type* node) {
        node_type* right = node->right;
        node->right = right->left;
        if (right->left) {
            right->left->parent = node;
        }

        right->parent = node->parent;
        if (node == m_root) {
            m_root = right;
        } else if (node == node->parent->left) {
            node->parent->left = right;
        } else {
            node->parent->right = right;
        }

        right->left = node;
        node->parent = right;

        // 向上更新旋转后的高度
        update_heights(node);
    }

    // 右旋：表示左子树比右子树高，会将左孩子的右子树挂载在局部根节点的左子树，并将左子树提升为局部根节点
    void right_rotate(node_type* node) {
        node_type* left = node->left;
        node->left = left->right;
        if (left->right) {
            left->right->parent = node;
        }
        
        left->parent = node->parent;
        if (node == m_root) {
            m_root = left;
        } else if (node == node->parent->right) {
            node->parent->right = left;
        } else {
            node->parent->left = left;
        }

        left->right = node;
        node->parent = left;

        // 向上更新旋转后的高度
        update_heights(node);
    }

    // 根据平衡因子进行重新平衡
    void rebalance(node_type* node) {
        while (node) {
            node_type* parent = node->parent;
            if (get_balance_factor(node) < -1) {
                if (get_balance_factor(node->right) > 0) {
                    // 如果右孩子的左子树高度比右孩子的右子树高，则需要先进行右旋
                    right_rotate(node->right);
                }
                left_rotate(node);
            }
            if (get_balance_factor(node) > 1) {
                if (get_balance_factor(node->left) > 0) {
                    // 如果左孩子的右子树比左孩子的左子树高，则需要先进行左旋
                    left_rotate(node->left);
                }
                right_rotate(node);
            }
            node = parent;
        }
    }

private:
    node_type* m_root = nullptr;
};
```

---

## 适合的应用

- 组织和存储大型数据，适用于高频查找、低频增删的场景
- 用于构建数据库中的索引系统
- 红黑树也是一种常见的平衡二叉搜索树；想较于 AVL 树，红黑树的平衡条件更宽松，插入和删除节点所需的旋转操作更少，节点增删操作的平均效率更高

---

## 引用

- [AVL 树](https://www.hello-algo.com/chapter_tree/avl_tree)
- [AVL 树可视化](https://www.cs.usfca.edu/~galles/visualization/AVLtree.html)
- [二叉树可视化](https://ggorlen.github.io/prettybt/)
