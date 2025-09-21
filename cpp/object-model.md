# C++ 对象模型（内存存储布局）


## GCC 不同继承方式下的内存存储模型

> 以下是在 GCC 下的单继承、多继承、虚继承的虚表、虚表列表内存存储布局情况。
> 
> 在 GCC 下可以使用 -fdump-lang-class 选项显示类的内部布局情况。


### 单继承

#### 单继承无重写

```cpp
struct Base {
    int var1;
    virtual ~Base() {}
    virtual void func1() {}
};

struct Derived: public Base {
    int var2;
    virtual void func2() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base // Base 虚表
Base::_ZTV4Base: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI4Base) // Base 的 typeinfo
16    (int (*)(...))Base::~Base // 析构函数本身
24    (int (*)(...))Base::~Base // 析构函数 thunk（包含了调用析构函数本身、delete 过程以及一些其他内容）
32    (int (*)(...))Base::func1 // Base 的 func1 函数

// Base 实例化的内存布局情况
Class Base
   size=16 align=8
   base size=12 base align=8
Base (0x0x1340cf00) 0 // 表示 Base 的偏移量为 0
    vptr=((& Base::_ZTV4Base) + 16) // 指向虚表第三个元素（偏移量为 16 字节）

Vtable for Derived // Derived 虚表
Derived::_ZTV7Derived: 6 entries
0     (int (*)(...))0 // 用于计算 Base 指针调用函数时的 this 指针，与 Base 共用前一部分的虚表
8     (int (*)(...))(& _ZTI7Derived) // Derived 的 typeinfo
16    (int (*)(...))Derived::~Derived // 析构函数本身，会调用基类构造函数
24    (int (*)(...))Derived::~Derived // 析构函数 thunk（包含了调用析构函数本身、delete 过程以及一些其他内容）
32    (int (*)(...))Base::func1 // Base 的 func1 函数
40    (int (*)(...))Derived::func2 // Derived 的 func2 函数

// Derived 实例化的内存布局情况
Class Derived
   size=16 align=8
   base size=16 base align=8
Derived (0x0x13412dd0) 0 // 表示 Derived 的偏移量为 0
    vptr=((& Derived::_ZTV7Derived) + 16) // 指向虚表第三个元素（偏移量为 16 字节）
Base (0x0x1344e240) 0 // 表示 Base 的偏移量为 0
      primary-for Derived (0x0x13412dd0) // 与基类共用 vptr
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-1](/assets/images/cpp/object-model-1.svg)

---

#### 单继承有重写

```cpp
struct Base {
    int var1;
    virtual ~Base() {}
    virtual void func1() {}
};

struct Derived: public Base {
    int var2;
    void func1() override {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base
Base::_ZTV4Base: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI4Base)
16    (int (*)(...))Base::~Base
24    (int (*)(...))Base::~Base
32    (int (*)(...))Base::func1 // Base 的 func1 函数

Class Base
   size=16 align=8
   base size=12 base align=8
Base (0x0x133fcf00) 0
    vptr=((& Base::_ZTV4Base) + 16)

Vtable for Derived
Derived::_ZTV7Derived: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI7Derived)
16    (int (*)(...))Derived::~Derived
24    (int (*)(...))Derived::~Derived
32    (int (*)(...))Derived::func1 // Derived 重写了 Base 的 func1 函数

Class Derived
   size=16 align=8
   base size=16 base align=8
Derived (0x0x13402dd0) 0
    vptr=((& Derived::_ZTV7Derived) + 16)
Base (0x0x1343e240) 0
      primary-for Derived (0x0x13402dd0)
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-2](/assets/images/cpp/object-model-2.svg)

---

### 多继承

#### 多继承无重写

```cpp
struct Base1 {
    int var1;
    virtual ~Base1() {}
    virtual void func1() {}
};

struct Base2 {
    int var2;
    virtual ~Base2() {}
    virtual void func2() {}
};

struct Derived: public Base1, public Base2 {
    int var3;
    virtual void func3() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base1
Base1::_ZTV5Base1: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base1)
16    (int (*)(...))Base1::~Base1
24    (int (*)(...))Base1::~Base1
32    (int (*)(...))Base1::func1 // Base1 的 func1 函数

Class Base1
   size=16 align=8
   base size=12 base align=8
Base1 (0x0x13314f00) 0
    vptr=((& Base1::_ZTV5Base1) + 16)

Vtable for Base2
Base2::_ZTV5Base2: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base2)
16    (int (*)(...))Base2::~Base2
24    (int (*)(...))Base2::~Base2
32    (int (*)(...))Base2::func2 // Base2 的 func2 函数

Class Base2
   size=16 align=8
   base size=12 base align=8
Base2 (0x0x13356240) 0
    vptr=((& Base2::_ZTV5Base2) + 16)

Vtable for Derived
Derived::_ZTV7Derived: 11 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI7Derived) // Derived 的 typeinfo
16    (int (*)(...))Derived::~Derived
24    (int (*)(...))Derived::~Derived
32    (int (*)(...))Base1::func1 // Base1 的 func1 函数，未重写
40    (int (*)(...))Derived::func3 // Derived 的 func3 函数
48    (int (*)(...))-16 // Base2：用于计算 this 指向，因为 Base2 指针与 Derived 指针实际有 16 字节的偏移，所以在调用函数时需要将 Base2 指针减去 16 字节作为 this 指针，修改后实际指向 Derived 对象
56    (int (*)(...))(& _ZTI7Derived) // Base2：实际指向 Derived 的 typeinfo
64    (int (*)(...))Derived::_ZThn16_N7DerivedD1Ev // Base2 指针的析构函数，实际会跳转至 Derived 的析构函数
72    (int (*)(...))Derived::_ZThn16_N7DerivedD0Ev // Base2 指针的析构 thunk，实际会跳转至  Derived 的析构 thunk
80    (int (*)(...))Base2::func2 // Base2 的 func2 函数

Class Derived
   size=32 align=8
   base size=32 base align=8
Derived (0x0x12e6c7e0) 0
    vptr=((& Derived::_ZTV7Derived) + 16) // Derived 的虚函数表指针指向 Vtable for Derived 的第 16 字节
Base1 (0x0x13356540) 0 // Base1 的偏移为 0 字节
      primary-for Derived (0x0x12e6c7e0) // Base1 的虚函数表指针为与 Derived 一致
Base2 (0x0x133565a0) 16 // Base2 的偏移为 16 字节
      vptr=((& Derived::_ZTV7Derived) + 64) // Base2 的虚函数表指针指向 Vtable for Derived 的第 64 字节
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-3](/assets/images/cpp/object-model-3.svg)

---

#### 多继承有重写

```cpp
struct Base1 {
    int var1;
    virtual ~Base1() {}
    virtual void func1() {}
};

struct Base2 {
    int var2;
    virtual ~Base2() {}
    virtual void func2() {}
};

struct Derived: public Base1, public Base2 {
    int var3;
    void func1() override {}
    void func2() override {}
    virtual void func3() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base1
Base1::_ZTV5Base1: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base1)
16    (int (*)(...))Base1::~Base1
24    (int (*)(...))Base1::~Base1
32    (int (*)(...))Base1::func1 // Base1 的 func1 函数

Class Base1
   size=16 align=8
   base size=12 base align=8
Base1 (0x0x13333f00) 0
    vptr=((& Base1::_ZTV5Base1) + 16)

Vtable for Base2
Base2::_ZTV5Base2: 5 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base2)
16    (int (*)(...))Base2::~Base2
24    (int (*)(...))Base2::~Base2
32    (int (*)(...))Base2::func2 // Base2 的 func2 函数

Class Base2
   size=16 align=8
   base size=12 base align=8
Base2 (0x0x13375240) 0
    vptr=((& Base2::_ZTV5Base2) + 16)

Vtable for Derived
Derived::_ZTV7Derived: 12 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI7Derived) // Derived 的 typeinfo
16    (int (*)(...))Derived::~Derived
24    (int (*)(...))Derived::~Derived
32    (int (*)(...))Derived::func1 // Derived 的 func1 函数，已重写
40    (int (*)(...))Derived::func2 // Derived 的 func2 函数，已重写
48    (int (*)(...))Derived::func3 // Derived 的 func3 函数
56    (int (*)(...))-16 // 用于计算 Base2 调用函数时的 this 指针
64    (int (*)(...))(& _ZTI7Derived) // Derived 的 typeinfo
72    (int (*)(...))Derived::_ZThn16_N7DerivedD1Ev // Base2 指针的析构函数，实际会跳转至 Derived 的析构函数
80    (int (*)(...))Derived::_ZThn16_N7DerivedD0Ev // Base2 指针的析构 thunk，实际会跳转至 Derived 的析构 thunk
88    (int (*)(...))Derived::_ZThn16_N7Derived5func2Ev // Base2 指针的 func2 函数，实际会跳转至 Derived 的 func2 函数

Class Derived
   size=32 align=8 // 大小为 32 字节，按 8 字节对齐
   base size=32 base align=8
Derived (0x0x12e8b7e0) 0
    vptr=((& Derived::_ZTV7Derived) + 16) // 与 Base1 共用的虚函数表指针
Base1 (0x0x13375540) 0
      primary-for Derived (0x0x12e8b7e0) // 与 Derived 共用虚函数表指针
Base2 (0x0x133755a0) 16
      vptr=((& Derived::_ZTV7Derived) + 72) // Base2 的虚函数表指针
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-4](/assets/images/cpp/object-model-4.svg)

---

### 虚继承

#### 简单虚继承（不含虚函数）

```cpp
struct Base {
    int var1;
    void func1() {}
};

struct Derived: public virtual Base {
    int var2;
    void func2() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Class Base
   size=4 align=4
   base size=4 base align=4
Base (0x0x133ccf00) 0

Vtable for Derived
Derived::_ZTV7Derived: 3 entries
0     12 // vbase offset，虚基类 Base 在 Derived 实例中的偏移量
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI7Derived) // Derived 的 typeinfo

VTT for Derived // Table of virtual table，虚表列表，用于存储指向不同虚函数表的指针
Derived::_ZTT7Derived: 1 entries
0     ((& Derived::_ZTV7Derived) + 24) // 表示 Derived 的虚函数表指针，此处实际指向了虚表结尾

Class Derived
   size=16 align=8 // 大小为 16 字节，按 8 字节对齐
   base size=12 base align=8
Derived (0x0x133d2c30) 0 // 表示 Derived 的偏移量
    vptridx=0 vptr=((& Derived::_ZTV7Derived) + 24) // vptridx 表示在 vtt 表中的虚函数表指针偏移； vptr 表示 Derived 的的虚函数表指针，此处实际指向了虚表结尾
Base (0x0x1340c000) 12 virtual // 表示 Base 在 Derived 实例中的起始偏移，virtual 表示为虚基类
      vbaseoffset=-24 // 从 Base 的位置到 Derived 的 vptr 的偏移量（用于反向定位，验证虚基类与派生类的关系）
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-5](/assets/images/cpp/object-model-5.svg)

---

#### 简单虚继承（含虚函数）

```cpp
struct Base {
    int var1;
    virtual ~Base() {}
    virtual void func1() {}
    virtual void func2() {}
};

struct Derived: public virtual Base {
    int var2;
    void func2() override {}
    virtual void func3() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base
Base::_ZTV4Base: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI4Base)
16    (int (*)(...))Base::~Base
24    (int (*)(...))Base::~Base
32    (int (*)(...))Base::func1
40    (int (*)(...))Base::func2

Class Base
   size=16 align=8
   base size=12 base align=8
Base (0x0x133cdf00) 0
    vptr=((& Base::_ZTV4Base) + 16)

Vtable for Derived
Derived::_ZTV7Derived: 16 entries
0     16 // vbase offset，虚基类 Base 在 Derived 实例中的偏移量
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI7Derived) // typeinfo of Derived
24    (int (*)(...))Derived::func2 // Derived 的 func2 函数，已重写
32    (int (*)(...))Derived::func3 // Derived 的 func3 函数
40    (int (*)(...))Derived::~Derived // Derived 析构函数
48    (int (*)(...))Derived::~Derived // Derived 析构 thunk
56    18446744073709551600 // 实际是-16（无符号表示），用于指针调整
64    0
72    18446744073709551600 // 实际是-16（无符号表示），用于指针调整
80    (int (*)(...))-16 // 用于计算 Base 指针调用函数时的 this 指针
88    (int (*)(...))(& _ZTI7Derived) // typeinfo of Derived
96    (int (*)(...))Derived::_ZTv0_n24_N7DerivedD1Ev // Base2 指针的析构函数，实际会跳转至 Derived 的析构函数
104   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD0Ev // Base2 指针的析构 thunk，实际会跳转至 Derived 的析构 thunk
112   (int (*)(...))Base::func1 // Base 的 func1 函数
120   (int (*)(...))Derived::_ZTv0_n40_N7Derived5func2Ev // Base 指针的 func2 函数，实际会跳转至 Derived 的 func2 函数

VTT for Derived
Derived::_ZTT7Derived: 2 entries
0     ((& Derived::_ZTV7Derived) + 24) // 表示 Derived 的虚函数表指针
8     ((& Derived::_ZTV7Derived) + 96) // 表示 Base 的虚函数表指针

Class Derived
   size=32 align=8
   base size=12 base align=8
Derived (0x0x133d3e38) 0
    vptridx=0 vptr=((& Derived::_ZTV7Derived) + 24) // vptridx 表示在 vtt 表中的虚函数表指针偏移； vptr 表示 Derived 的的虚函数表指针
Base (0x0x1340f2a0) 16 virtual
      vptridx=8 vbaseoffset=-24 vptr=((& Derived::_ZTV7Derived) + 96) // 表示从 Base 的 vptr 位置到 Derived 对象起始位置的偏移量；vptr 表示 Base 的的虚函数表指针
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-6](/assets/images/cpp/object-model-6.svg)

---

#### 菱形继承

```cpp
struct Base1 {
    int var1;
    virtual ~Base1() {}
    virtual void func1() {}
    virtual void func2() {}
};

struct Base2: public virtual Base1 {
    int var2;
    void func1() override {}
    virtual void func3() {}
};

struct Base3: public virtual Base1 {
    int var3;
    void func1() override {}
    virtual void func4() {}
};

struct Derived: public Base2, public Base3 {
    int var4;
    void func1() override {}
    void func3() override {}
    virtual void func5() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base1
Base1::_ZTV5Base1: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base1)
16    (int (*)(...))Base1::~Base1
24    (int (*)(...))Base1::~Base1
32    (int (*)(...))Base1::func1
40    (int (*)(...))Base1::func2

Class Base1
   size=16 align=8
   base size=12 base align=8
Base1 (0x0x133faf00) 0
    vptr=((& Base1::_ZTV5Base1) + 16)

Vtable for Base2
Base2::_ZTV5Base2: 16 entries
0     16
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI5Base2)
24    (int (*)(...))Base2::func1
32    (int (*)(...))Base2::func3
40    (int (*)(...))Base2::~Base2
48    (int (*)(...))Base2::~Base2
56    0
64    18446744073709551600
72    18446744073709551600
80    (int (*)(...))-16
88    (int (*)(...))(& _ZTI5Base2)
96    (int (*)(...))Base2::_ZTv0_n24_N5Base2D1Ev
104   (int (*)(...))Base2::_ZTv0_n24_N5Base2D0Ev
112   (int (*)(...))Base2::_ZTv0_n32_N5Base25func1Ev
120   (int (*)(...))Base1::func2

VTT for Base2
Base2::_ZTT5Base2: 2 entries
0     ((& Base2::_ZTV5Base2) + 24)
8     ((& Base2::_ZTV5Base2) + 96)

Class Base2
   size=32 align=8
   base size=12 base align=8
Base2 (0x0x13400e38) 0
    vptridx=0 vptr=((& Base2::_ZTV5Base2) + 24)
Base1 (0x0x1343c2a0) 16 virtual
      vptridx=8 vbaseoffset=-24 vptr=((& Base2::_ZTV5Base2) + 96)

Vtable for Base3
Base3::_ZTV5Base3: 16 entries
0     16
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI5Base3)
24    (int (*)(...))Base3::func1
32    (int (*)(...))Base3::func4
40    (int (*)(...))Base3::~Base3
48    (int (*)(...))Base3::~Base3
56    0
64    18446744073709551600
72    18446744073709551600
80    (int (*)(...))-16
88    (int (*)(...))(& _ZTI5Base3)
96    (int (*)(...))Base3::_ZTv0_n24_N5Base3D1Ev
104   (int (*)(...))Base3::_ZTv0_n24_N5Base3D0Ev
112   (int (*)(...))Base3::_ZTv0_n32_N5Base35func1Ev
120   (int (*)(...))Base1::func2

VTT for Base3
Base3::_ZTT5Base3: 2 entries
0     ((& Base3::_ZTV5Base3) + 24)
8     ((& Base3::_ZTV5Base3) + 96)

Class Base3
   size=32 align=8
   base size=12 base align=8
Base3 (0x0x13400ea0) 0
    vptridx=0 vptr=((& Base3::_ZTV5Base3) + 24)
Base1 (0x0x1343c3c0) 16 virtual
      vptridx=8 vbaseoffset=-24 vptr=((& Base3::_ZTV5Base3) + 96)

Vtable for Derived
Derived::_ZTV7Derived: 24 entries
0     32
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI7Derived)
24    (int (*)(...))Derived::func1
32    (int (*)(...))Derived::func3
40    (int (*)(...))Derived::~Derived
48    (int (*)(...))Derived::~Derived
56    (int (*)(...))Derived::func5
64    16
72    (int (*)(...))-16
80    (int (*)(...))(& _ZTI7Derived)
88    (int (*)(...))Derived::_ZThn16_N7Derived5func1Ev
96    (int (*)(...))Base3::func4
104   (int (*)(...))Derived::_ZThn16_N7DerivedD1Ev
112   (int (*)(...))Derived::_ZThn16_N7DerivedD0Ev
120   0
128   18446744073709551584
136   18446744073709551584
144   (int (*)(...))-32
152   (int (*)(...))(& _ZTI7Derived)
160   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD1Ev
168   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD0Ev
176   (int (*)(...))Derived::_ZTv0_n32_N7Derived5func1Ev
184   (int (*)(...))Base1::func2

Construction vtable for Base2 (0x0x13445138 instance) in Derived // 构造 Derived 时 Base2 阶段的临时 vtable
Derived::_ZTC7Derived0_5Base2: 16 entries
0     32
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI5Base2)
24    (int (*)(...))Base2::func1
32    (int (*)(...))Base2::func3
40    0
48    0
56    0
64    18446744073709551584
72    18446744073709551584
80    (int (*)(...))-32
88    (int (*)(...))(& _ZTI5Base2)
96    0
104   0
112   (int (*)(...))Base2::_ZTv0_n32_N5Base25func1Ev
120   (int (*)(...))Base1::func2

Construction vtable for Base3 (0x0x134451a0 instance) in Derived // 构造 Derived 时 Base3 阶段的临时 vtable
Derived::_ZTC7Derived16_5Base3: 16 entries
0     16
8     (int (*)(...))0
16    (int (*)(...))(& _ZTI5Base3)
24    (int (*)(...))Base3::func1
32    (int (*)(...))Base3::func4
40    0
48    0
56    0
64    18446744073709551600
72    18446744073709551600
80    (int (*)(...))-16
88    (int (*)(...))(& _ZTI5Base3)
96    0
104   0
112   (int (*)(...))Base3::_ZTv0_n32_N5Base35func1Ev
120   (int (*)(...))Base1::func2

VTT for Derived
Derived::_ZTT7Derived: 7 entries
0     ((& Derived::_ZTV7Derived) + 24)
8     ((& Derived::_ZTC7Derived0_5Base2) + 24)
16    ((& Derived::_ZTC7Derived0_5Base2) + 96)
24    ((& Derived::_ZTC7Derived16_5Base3) + 24)
32    ((& Derived::_ZTC7Derived16_5Base3) + 96)
40    ((& Derived::_ZTV7Derived) + 160)
48    ((& Derived::_ZTV7Derived) + 88)

Class Derived
   size=48 align=8
   base size=32 base align=8
Derived (0x0x12f6c7e0) 0
    vptridx=0 vptr=((& Derived::_ZTV7Derived) + 24)
Base2 (0x0x13445138) 0
      primary-for Derived (0x0x12f6c7e0)
      subvttidx=8
Base1 (0x0x1343c4e0) 32 virtual
        vptridx=40 vbaseoffset=-24 vptr=((& Derived::_ZTV7Derived) + 160)
Base3 (0x0x134451a0) 16
      subvttidx=24 vptridx=48 vptr=((& Derived::_ZTV7Derived) + 88)
Base1 (0x0x1343c4e0) alternative-path // 确认Base1为共享实例（无冗余）
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-7](/assets/images/cpp/object-model-7.svg)

---

#### 双菱形多继承

```cpp
struct Base1 {
    int var1;
    virtual ~Base1() {}
    virtual void func1() {}
    virtual void func2() {}
};

struct Base2 {
    int var2;
    virtual ~Base2() {}
    virtual void func3() {}
    virtual void func4() {}
};

struct Base3: public virtual Base1, public virtual Base2 {
    int var3;
    void func1() override {}
    void func3() override {}
    virtual void func5() {}
};

struct Base4: public virtual Base1, public virtual Base2 {
    int var4;
    void func1() override {}
    void func3() override {}
    virtual void func6() {}
};

struct Derived: public Base3, public Base4 {
    int var5;
    void func1() override {}
    void func3() override {}
    void func5() override {}
    virtual void func7() {}
};
```

类和实例的内存布局情况如下所示：

```plaintext
Vtable for Base1
Base1::_ZTV5Base1: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base1)
16    (int (*)(...))Base1::~Base1
24    (int (*)(...))Base1::~Base1
32    (int (*)(...))Base1::func1
40    (int (*)(...))Base1::func2

Class Base1
   size=16 align=8
   base size=12 base align=8
Base1 (0x0x13433f00) 0
    vptr=((& Base1::_ZTV5Base1) + 16)

Vtable for Base2
Base2::_ZTV5Base2: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI5Base2)
16    (int (*)(...))Base2::~Base2
24    (int (*)(...))Base2::~Base2
32    (int (*)(...))Base2::func3
40    (int (*)(...))Base2::func4

Class Base2
   size=16 align=8
   base size=12 base align=8
Base2 (0x0x134752a0) 0
    vptr=((& Base2::_ZTV5Base2) + 16)

Vtable for Base3
Base3::_ZTV5Base3: 27 entries
0     32
8     16
16    (int (*)(...))0
24    (int (*)(...))(& _ZTI5Base3)
32    (int (*)(...))Base3::func1
40    (int (*)(...))Base3::func3
48    (int (*)(...))Base3::func5
56    (int (*)(...))Base3::~Base3
64    (int (*)(...))Base3::~Base3
72    0
80    18446744073709551600
88    18446744073709551600
96    (int (*)(...))-16
104   (int (*)(...))(& _ZTI5Base3)
112   (int (*)(...))Base3::_ZTv0_n24_N5Base3D1Ev
120   (int (*)(...))Base3::_ZTv0_n24_N5Base3D0Ev
128   (int (*)(...))Base3::_ZTv0_n32_N5Base35func1Ev
136   (int (*)(...))Base1::func2
144   0
152   18446744073709551584
160   18446744073709551584
168   (int (*)(...))-32
176   (int (*)(...))(& _ZTI5Base3)
184   (int (*)(...))Base3::_ZTv0_n24_N5Base3D1Ev
192   (int (*)(...))Base3::_ZTv0_n24_N5Base3D0Ev
200   (int (*)(...))Base3::_ZTv0_n32_N5Base35func3Ev
208   (int (*)(...))Base2::func4

VTT for Base3
Base3::_ZTT5Base3: 3 entries
0     ((& Base3::_ZTV5Base3) + 32)
8     ((& Base3::_ZTV5Base3) + 112)
16    ((& Base3::_ZTV5Base3) + 184)

Class Base3
   size=48 align=8
   base size=12 base align=8
Base3 (0x0x12f8b7e0) 0
    vptridx=0 vptr=((& Base3::_ZTV5Base3) + 32)
Base1 (0x0x13475600) 16 virtual
      vptridx=8 vbaseoffset=-24 vptr=((& Base3::_ZTV5Base3) + 112)
Base2 (0x0x13475660) 32 virtual
      vptridx=16 vbaseoffset=-32 vptr=((& Base3::_ZTV5Base3) + 184)

Vtable for Base4
Base4::_ZTV5Base4: 27 entries
0     32
8     16
16    (int (*)(...))0
24    (int (*)(...))(& _ZTI5Base4)
32    (int (*)(...))Base4::func1
40    (int (*)(...))Base4::func3
48    (int (*)(...))Base4::func6
56    (int (*)(...))Base4::~Base4
64    (int (*)(...))Base4::~Base4
72    0
80    18446744073709551600
88    18446744073709551600
96    (int (*)(...))-16
104   (int (*)(...))(& _ZTI5Base4)
112   (int (*)(...))Base4::_ZTv0_n24_N5Base4D1Ev
120   (int (*)(...))Base4::_ZTv0_n24_N5Base4D0Ev
128   (int (*)(...))Base4::_ZTv0_n32_N5Base45func1Ev
136   (int (*)(...))Base1::func2
144   0
152   18446744073709551584
160   18446744073709551584
168   (int (*)(...))-32
176   (int (*)(...))(& _ZTI5Base4)
184   (int (*)(...))Base4::_ZTv0_n24_N5Base4D1Ev
192   (int (*)(...))Base4::_ZTv0_n24_N5Base4D0Ev
200   (int (*)(...))Base4::_ZTv0_n32_N5Base45func3Ev
208   (int (*)(...))Base2::func4

VTT for Base4
Base4::_ZTT5Base4: 3 entries
0     ((& Base4::_ZTV5Base4) + 32)
8     ((& Base4::_ZTV5Base4) + 112)
16    ((& Base4::_ZTV5Base4) + 184)

Class Base4
   size=48 align=8
   base size=12 base align=8
Base4 (0x0x12f8b850) 0
    vptridx=0 vptr=((& Base4::_ZTV5Base4) + 32)
Base1 (0x0x134757e0) 16 virtual
      vptridx=8 vbaseoffset=-24 vptr=((& Base4::_ZTV5Base4) + 112)
Base2 (0x0x13475840) 32 virtual
      vptridx=16 vbaseoffset=-32 vptr=((& Base4::_ZTV5Base4) + 184)

Vtable for Derived
Derived::_ZTV7Derived: 37 entries
0     48
8     32
16    (int (*)(...))0
24    (int (*)(...))(& _ZTI7Derived)
32    (int (*)(...))Derived::func1
40    (int (*)(...))Derived::func3
48    (int (*)(...))Derived::func5
56    (int (*)(...))Derived::~Derived
64    (int (*)(...))Derived::~Derived
72    (int (*)(...))Derived::func7
80    32
88    16
96    (int (*)(...))-16
104   (int (*)(...))(& _ZTI7Derived)
112   (int (*)(...))Derived::_ZThn16_N7Derived5func1Ev
120   (int (*)(...))Derived::_ZThn16_N7Derived5func3Ev
128   (int (*)(...))Base4::func6
136   (int (*)(...))Derived::_ZThn16_N7DerivedD1Ev
144   (int (*)(...))Derived::_ZThn16_N7DerivedD0Ev
152   0
160   18446744073709551584
168   18446744073709551584
176   (int (*)(...))-32
184   (int (*)(...))(& _ZTI7Derived)
192   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD1Ev
200   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD0Ev
208   (int (*)(...))Derived::_ZTv0_n32_N7Derived5func1Ev
216   (int (*)(...))Base1::func2
224   0
232   18446744073709551568
240   18446744073709551568
248   (int (*)(...))-48
256   (int (*)(...))(& _ZTI7Derived)
264   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD1Ev
272   (int (*)(...))Derived::_ZTv0_n24_N7DerivedD0Ev
280   (int (*)(...))Derived::_ZTv0_n32_N7Derived5func3Ev
288   (int (*)(...))Base2::func4

Construction vtable for Base3 (0x0x12f8b930 instance) in Derived
Derived::_ZTC7Derived0_5Base3: 27 entries
0     48
8     32
16    (int (*)(...))0
24    (int (*)(...))(& _ZTI5Base3)
32    (int (*)(...))Base3::func1
40    (int (*)(...))Base3::func3
48    (int (*)(...))Base3::func5
56    0
64    0
72    0
80    18446744073709551584
88    18446744073709551584
96    (int (*)(...))-32
104   (int (*)(...))(& _ZTI5Base3)
112   0
120   0
128   (int (*)(...))Base3::_ZTv0_n32_N5Base35func1Ev
136   (int (*)(...))Base1::func2
144   0
152   18446744073709551568
160   18446744073709551568
168   (int (*)(...))-48
176   (int (*)(...))(& _ZTI5Base3)
184   0
192   0
200   (int (*)(...))Base3::_ZTv0_n32_N5Base35func3Ev
208   (int (*)(...))Base2::func4

Construction vtable for Base4 (0x0x12f8b9a0 instance) in Derived
Derived::_ZTC7Derived16_5Base4: 27 entries
0     32
8     16
16    (int (*)(...))0
24    (int (*)(...))(& _ZTI5Base4)
32    (int (*)(...))Base4::func1
40    (int (*)(...))Base4::func3
48    (int (*)(...))Base4::func6
56    0
64    0
72    0
80    18446744073709551600
88    18446744073709551600
96    (int (*)(...))-16
104   (int (*)(...))(& _ZTI5Base4)
112   0
120   0
128   (int (*)(...))Base4::_ZTv0_n32_N5Base45func1Ev
136   (int (*)(...))Base1::func2
144   0
152   18446744073709551584
160   18446744073709551584
168   (int (*)(...))-32
176   (int (*)(...))(& _ZTI5Base4)
184   0
192   0
200   (int (*)(...))Base4::_ZTv0_n32_N5Base45func3Ev
208   (int (*)(...))Base2::func4

VTT for Derived
Derived::_ZTT7Derived: 10 entries
0     ((& Derived::_ZTV7Derived) + 32)
8     ((& Derived::_ZTC7Derived0_5Base3) + 32)
16    ((& Derived::_ZTC7Derived0_5Base3) + 112)
24    ((& Derived::_ZTC7Derived0_5Base3) + 184)
32    ((& Derived::_ZTC7Derived16_5Base4) + 32)
40    ((& Derived::_ZTC7Derived16_5Base4) + 112)
48    ((& Derived::_ZTC7Derived16_5Base4) + 184)
56    ((& Derived::_ZTV7Derived) + 192)
64    ((& Derived::_ZTV7Derived) + 264)
72    ((& Derived::_ZTV7Derived) + 112)

Class Derived
   size=64 align=8
   base size=32 base align=8
Derived (0x0x12f8b8c0) 0
    vptridx=0 vptr=((& Derived::_ZTV7Derived) + 32)
Base3 (0x0x12f8b930) 0
      primary-for Derived (0x0x12f8b8c0)
      subvttidx=8
Base1 (0x0x134759c0) 32 virtual
        vptridx=56 vbaseoffset=-24 vptr=((& Derived::_ZTV7Derived) + 192)
Base2 (0x0x13475a20) 48 virtual
        vptridx=64 vbaseoffset=-32 vptr=((& Derived::_ZTV7Derived) + 264)
Base4 (0x0x12f8b9a0) 16
      subvttidx=32 vptridx=72 vptr=((& Derived::_ZTV7Derived) + 112)
Base1 (0x0x134759c0) alternative-path
Base2 (0x0x13475a20) alternative-path
```

Derived 类实例和虚表可视化内存布局情况如下图所示：

![object-model-8](/assets/images/cpp/object-model-8.svg)


## 引用

- [深入理解C++对象模型(开始)--由virtual继承说起(续）](https://segmentfault.com/a/1190000041507371)
- [深入理解C++对像模型--vtable 布局](https://zhuanlan.zhihu.com/p/496115833)
- [深入理解C++对象模型(开始)--由virtual继承说起(续）](https://zhuanlan.zhihu.com/p/462519480)
- [C++ Virtual Table Tables(VTT)](https://nimrod.blog/posts/cpp-virtual-table-tables/)
- [C++在gcc下的单继承，多继承，虚继承的内存布局](https://www.freesion.com/article/29161335768/#_15)
