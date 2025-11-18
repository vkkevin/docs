# Valgrind

Valgrind 是一个 Linux 下的动态分析工具，通过模拟程序的执行来监控内存分配和释放

## 安装（APT）

```bash
sudo apt install valgrind
```

## 使用示例

```bash
valgrind --leak-check=yes ./example
```

## 常用选项

- `--leak-check=yes`选项启用内存泄漏检查
- `--show-reachable=yes`选项可以显示仍可访问的内存，帮助区分真正的泄漏和正常未释放的内存
- `--num-callers=20`选项可以显示更长的堆栈跟踪，方便定位问题
- `--log-file=valgrind.log`选项标志指定 valgrind 输出打印到 valgrind.log 日志文件

## 结果解析

- **HEAP SUMMARY**：显示程序结束时仍在使用的内存总量和块数
- **LEAK SUMMARY**：总结内存泄漏情况，包括：
    - `definitely lost`：明确未释放的内存。
    - `indirectly lost`：因其他内存块未释放而间接导致的泄漏。
    - `possibly lost`：可能未释放的内存。
    - `still reachable`：程序结束时仍可访问的内存（通常不是泄漏）。
- **Stack Trace**：为每个内存泄漏提供堆栈跟踪，显示内存分配的位置

## 引用

- [Valgrind](https://douyixuan.github.io/posts/compiler/valgrind/)
