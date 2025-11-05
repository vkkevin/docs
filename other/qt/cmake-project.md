# 构建 Qt CMake 工程
## 一、项目背景 & 目标

在使用 Qt 6 进行跨平台 GUI 开发时，Qt Creator 提供了强大的编辑和构建支持，但现实中我们常常需要一个纯 CMake 工程，不依赖 Qt Creator，方便在命令行、CLion、VSCode 等任意 IDE 下编译与部署。本篇博客记录我在学习 QML 时，如何使用 CMake 完成 Qt 工程构建的全过程，供日后复盘和分享。

## 二、环境准备

* **操作系统**：Windows 10／11
* **Qt 版本**：Qt 6.9.0（msvc2022\_64）
* **编译工具链**：Visual Studio 2022 (MSVC)
* **CMake 版本**：>= 3.20

> **注意**：请确保已安装相应 Qt 模块，以及在系统中设置好 Qt 安装路径。这里我将 Qt 安装在 `D:/DevelopEnv/Qt/6.9.0/msvc2022_64`。

## 三、核心 CMakeLists.txt 解析

下面给出完整的 `CMakeLists.txt`，并对关键部分进行逐步拆解：

```cmake
cmake_minimum_required(VERSION 3.20)
project(StudyQmlApp VERSION 1.0 LANGUAGES CXX)

# 自动处理 MOC/UIC/RCC
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)

# Qt 安装前缀，用于 find_package
set(CMAKE_PREFIX_PATH "D:/DevelopEnv/Qt/6.9.0/msvc2022_64")

# 启用 QML 语言服务器配置生成
set(QT_QML_GENERATE_QMLLS_INI ON)

# 查找 Qt6 Quick 模块
find_package(Qt6 REQUIRED COMPONENTS Quick)

# 启用 Qt 的标准工程模板功能，指定最低 Qt 版本
qt_standard_project_setup(REQUIRES 6.5)

# 添加可执行文件
qt_add_executable(StudyQmlApp
    main.cpp
)

# 添加 QML 模块
qt_add_qml_module(StudyQmlApp
    URI StudyQmlApp
    VERSION 1.0
    QML_FILES
        Main.qml
)

# 设置打包属性（Windows/ macOS）
set_target_properties(StudyQmlApp PROPERTIES
    MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

# 根据构建类型设置宏
if(CMAKE_BUILD_TYPE STREQUAL Release OR CMAKE_BUILD_TYPE STREQUAL RelWithDbgInfo)
    target_compile_definitions(StudyQmlApp PRIVATE
        NDEBUG QT_NO_DEBUG QT_NO_DEBUG_OUTPUT
    )
else()
    target_compile_definitions(StudyQmlApp PRIVATE
        DEBUG QT_DEBUG QT_DEBUG_OUTPUT
    )
endif()

# 安装配置
install(TARGETS StudyQmlApp
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

# 自动生成 QML 应用部署脚本
qt_generate_deploy_qml_app_script(
    TARGET StudyQmlApp
    OUTPUT_SCRIPT deploy_script
    MACOS_BUNDLE_POST_BUILD
    NO_UNSUPPORTED_PLATFORM_ERROR
    DEPLOY_USER_QML_MODULES_ON_UNSUPPORTED_PLATFORM
)
install(SCRIPT ${deploy_script})
```

### 3.1 自动化工具开关

```cmake
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)
```

* **`AUTOMOC`**：自动扫描并生成 MOC 代码（`Q_OBJECT`）
* **`AUTOUIC`**：自动处理 `.ui` 文件
* **`AUTORCC`**：自动编译 `.qrc` 资源文件

### 3.2 指定 Qt 安装位置

```cmake
set(CMAKE_PREFIX_PATH "D:/DevelopEnv/Qt/6.9.0/msvc2022_64")
```

* CMake 在 `lib/cmake/Qt6` 下寻找 `Qt6Config.cmake`。
* 避免每次命令行传参，直接写入工程。

### 3.3 查找与链接 Qt 模块

```cmake
find_package(Qt6 REQUIRED COMPONENTS Quick)
```

* Qt6 Quick：用于 QML 界面。
* 如果需要更多模块，追加 `Core Widgets Gui Network ...`。

### 3.4 添加可执行与 QML 模块

* **`qt_add_executable`**：替代传统 `add_executable`，自动处理 Qt 特性
* **`qt_add_qml_module`**：声明 QML 模块，简化资源部署

### 3.5 平台打包与部署脚本

```cmake
qt_generate_deploy_qml_app_script(...)
```

* 在编译后生成部署脚本(`deploy_script`)。
* 脚本会收集 Qt 运行时、QML 模块、依赖库到一处。
* 通过 `install(SCRIPT ...)`，可随安装一起执行。

## 四、命令行构建流程

```bash
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  # 若 CMAKE_PREFIX_PATH 未写入 CMakeLists，可在此指定
  #-DCMAKE_PREFIX_PATH="D:/DevelopEnv/Qt/6.9.0/msvc2022_64"
cmake --build . --config Release
cmake --install . --config Release
```

* **`--config Release`**：指定 MSVC 多配置生成器下的 Release 配置
* **`cmake --install`**：执行 `install()` 规则

## 五、常见问题 & 解决方案

1. **找不到 `Qt6Config.cmake`**

   * 确认 `CMAKE_PREFIX_PATH` 或 `Qt6_DIR` 指向正确路径。
2. **QML 模块加载失败**

   * 检查 `qt_add_qml_module` 中的 `URI` 与 QML 中 `import` 保持一致。
3. **调试符号过大**

   * 在 `RelWithDbgInfo` 配置中关闭调试输出，或使用 `strip` 工具。

## 六、总结与展望

通过纯 CMake 构建 Qt 6 工程，可以：

* 解耦 IDE，方便 CI/CD 管道集成
* 保持工程跨平台统一
* 利用 CMake 丰富插件（CTest、CPack）进行测试与打包

后续可考虑：

* 引入 `QtQuick3D` 实现 3D 克隆界面
* CI 上集成自动打包 AppImage／MSI／DMG
* 支持多语言 i18n 及自动化翻译文件生成

---
