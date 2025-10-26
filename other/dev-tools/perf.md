# Perf

Perf 是一个 Linux 下的性能分析工具，可以对进程进行采样，利用采样数据对程序性能进行分析

## 安装（APT）

```bash
sudo apt install linux-perf
```

## 安装 FlameGraph

FlameGraph 用于生成火焰图

Github：[FlameGraph](https://github.com/brendangregg/FlameGraph)

## 使用方法

perf 总体分为三种模式：
1. sample 模式
2. counting 模式
3. 其他模式

下图中整理了各模式对应的子命令：

![perf](/assets/images/dev-tools/perf.png)

常用的子命令有：
1. perf record：采样，生成 perf.data 二进制文件
2. perf annotate/report/script：分析 perf.data 文件，annotate 可以查看代码、report 可以统计分析、script 可以直接转换为文本格式
3. perf stat：counter，统计 event 的出现次数
4. perf top：整个系统的分析，类似于 top 命令，但是可以具体到函数，可以指定 event

## 使用示例

```bash
perf record -g -e cpu-clock ./example && perf script | ./FlameGraph/stackcollapse-perf.pl --all | ./FlameGraph/flamegraph.pl > out.svg
```

## 火焰图解析

cpu 火焰图可以用于分析 cpu 被那些线程、那些函数占用的，可以方便找到热点代码。

- `y`轴表示调用栈，每一层都是一个函数。调用栈越深，火焰就越高，顶部是正在执行的函数，下方都是它的父函数
- `x`轴表示抽样数，如果一个函数在`x`轴占据的宽度越宽，就表示它被抽到的次数越多，即执行时间越长。注：`x`轴不代表时间，而是所有的调用栈合并后，按字母顺序排列的

**火焰图就是看顶层的哪个函数占据的宽度最大。只要有“平顶”（plateaus），就表示该函数可能存在性能问题。**

## 引用

- [Install linux-perf](https://installati.one/install-linux-perf-debian-12/)
- [Linux 性能分析工具](https://www.zhifeiya.cn/post/2025/7/7/93a4738a)
- [Perf 和火焰图使用方法](https://cloud.tencent.com/developer/article/2245316)
