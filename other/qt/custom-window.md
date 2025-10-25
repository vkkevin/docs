# 自定义 Qt 窗口样式

## Windows 桌面窗口管理特性（DWM）
- Aero Snap
- Snap Assist
- Snap Layout
- Resizable

## 方法一：使用 Qt::CustomizeWindowHint + 自定义标题栏控件

> 当前版本未支持 windows 的 snap 特性

### 窗口：CustomMainWindow.hpp

```c++
#include <QMainWindow>
#include "CustomTopbar.hpp"

class CustomMainWindow: public QMainWindow {
    Q_OBJECT
    
public:
    explicit CustomMainWindow(QWidget* parent = nullptr): QMainWindow(parent) {
        setWindowFlags(Qt::Window | Qt::CustomizeWindowHint);
        setupUI();
    }

protected:
    void changeEvent(QEvent *event) override {
        QMainWindow::changeEvent(event);
        if (event->type() == QEvent::WindowStateChange) {
            m_topbar->updateWindowState(windowState());
        }
    }

private:
    void setupUI() {
        m_topbar = new CustomTopbar(this);
        m_topbar->setFixedHeight(32);
        m_topbar->setTitle("Data Recovery");
        m_topbar->setIcon(QIcon(":/app/icon"));
        m_topbar->updateWindowState(windowState());

        setupLayout();
        setupConnections();
    }

    void setupLayout() {
        QWidget* centralWidget = new QWidget(this);
        setCentralWidget(centralWidget);

        QVBoxLayout* layout = new QVBoxLayout(centralWidget);
        layout->setContentsMargins(0, 0, 0, 0);
        layout->setSpacing(0);
        layout->addWidget(m_topbar);
        
        QLabel* contentLabel = new QLabel("Main Content Area", centralWidget);
        contentLabel->setAlignment(Qt::AlignCenter);
        contentLabel->setStyleSheet("background-color: white;");
        layout->addWidget(contentLabel);
    }

    void setupConnections() {
        connect(m_topbar, &CustomTopbar::minimizeClicked, this, &CustomMainWindow::showMinimized, Qt::DirectConnection);
        connect(m_topbar, &CustomTopbar::maximizeClicked, [this]() {
            isMaximized() ? showNormal() : showMaximized();
        });
        connect(m_topbar, &CustomTopbar::closeClicked, this, &CustomMainWindow::close, Qt::DirectConnection);
        connect(m_topbar, &CustomTopbar::moveStarted, [this](auto&& mousePos) {
            m_dragMouseStartPos = mousePos;
            if (isMaximized()) {
                auto x = static_cast<double>(mousePos.x() - pos().x()) / width() * normalGeometry().width();
                m_dragStartPos = { mousePos.x() - static_cast<int>(x), pos().y() };
            } else {
                m_dragStartPos = pos();
            }
        });
        connect(m_topbar, &CustomTopbar::moving, [this](auto&& mousePos, auto&& delta) {
            constexpr int SNAP_THRESHOLD = 10;
            if (isMaximized()) {
                if (mousePos.y() < SNAP_THRESHOLD) {
                    return;
                }
                showNormal();
            } else if (mousePos.y() < SNAP_THRESHOLD) {
                showMaximized();
                return;
            }
            move(m_dragStartPos + delta);
        });
        connect(m_topbar, &CustomTopbar::moveFinished, [this](auto&& mousePos) { m_dragStartPos = {0, 0}; });
    }

private:
    QPoint m_dragStartPos{0, 0};
    QPoint m_dragMouseStartPos{0, 0};

    CustomTopbar* m_topbar = nullptr;
};
```

### 顶部栏（标题栏）：CustomTopbar.hpp

```c++
#include <QWidget>
#include <QLabel>
#include <QPushButton>
#include <QHBoxLayout>
#include <QMouseEvent>
#include <QIcon>
#include <QPixmap>
#include <QStyle>

class CustomTopbar : public QWidget {
    Q_OBJECT
    
public:
    explicit CustomTopbar(QWidget* parent = nullptr): QWidget(parent) {
        setupUI();
    }
    
    // 设置标题
    void setTitle(const QString& title) {
        m_titleLabel->setText(title);
    }
    
    // 设置图标
    void setIcon(const QIcon& icon) {
        m_iconLabel->setPixmap(icon.pixmap(24, 24));
    }

    void updateWindowState(Qt::WindowStates state) {
        if (state == Qt::WindowMaximized || state == Qt::WindowFullScreen) {
            m_maximizeButton->setIcon(style()->standardIcon(QStyle::SP_TitleBarNormalButton));
        } else {
            m_maximizeButton->setIcon(style()->standardIcon(QStyle::SP_TitleBarMaxButton));
        }
    }    

Q_SIGNALS:
    void minimizeClicked();
    void maximizeClicked();
    void restoreClicked();
    void closeClicked();
    
    // 事件处理
    void moveStarted(const QPoint& mousePos);
    void moving(const QPoint& mousePos, const QPoint& delta);
    void moveFinished(const QPoint& mousePos);

protected:
    void mouseDoubleClickEvent(QMouseEvent *event) override {
        if (event->button() == Qt::LeftButton) {
            emit maximizeClicked();
        }
        QWidget::mousePressEvent(event);
    }

    void mousePressEvent(QMouseEvent* event) override {
        if (event->button() == Qt::LeftButton) {
            if (geometry().contains(event->pos())) {
                m_isDragging = true;
                m_dragStartPos = event->globalPosition().toPoint();
                emit moveStarted(m_dragStartPos);
                event->accept();
            }
        }
        QWidget::mousePressEvent(event);
    }
    
    void mouseMoveEvent(QMouseEvent* event) override {
        if (m_isDragging) {
            auto targetPos = event->globalPosition().toPoint();
            emit moving(targetPos, targetPos - m_dragStartPos);
            event->accept();
        }
        QWidget::mouseMoveEvent(event);
    }
    
    void mouseReleaseEvent(QMouseEvent* event) override {
        m_isDragging = false;
        m_dragStartPos = {0, 0};
        emit moveFinished(event->globalPosition().toPoint());
        event->accept();
        QWidget::mouseReleaseEvent(event);
    }
     
private:
    void setupUI() {
        // 左侧区域（图标和标题）
        m_iconLabel = new QLabel(this);
        m_titleLabel = new QLabel(this);
        // 设置标题样式
        m_titleLabel->setStyleSheet("color: #333; font-weight: bold;");

        // 右侧窗口控制按钮
        m_minimizeButton = new QPushButton(this);
        m_maximizeButton = new QPushButton(this);
        m_closeButton = new QPushButton(this);
        
        // 设置按钮图标
        m_minimizeButton->setIcon(style()->standardIcon(QStyle::SP_TitleBarMinButton));
        m_maximizeButton->setIcon(style()->standardIcon(QStyle::SP_TitleBarMaxButton));
        m_closeButton->setIcon(style()->standardIcon(QStyle::SP_TitleBarCloseButton));
        
        // 设置按钮样式
        setupButtonStyle(m_minimizeButton);
        setupButtonStyle(m_maximizeButton);
        setupButtonStyle(m_closeButton);

        setupLayout();
        setupConnections();
    }
    
    void setupButtonStyle(QPushButton* button) {
        button->setFixedSize(30, 30);
        button->setFlat(true);
        button->setStyleSheet(
            "QPushButton {"
            "    border: none;"
            "    background-color: transparent;"
            "}"
            "QPushButton:hover {"
            "    background-color: #e0e0e0;"
            "}"
            "QPushButton:pressed {"
            "    background-color: #c0c0c0;"
            "}"
        );
    }
    
    void setupLayout() {
        QHBoxLayout* mainLayout = new QHBoxLayout(this);
        mainLayout->setContentsMargins(8, 0, 0, 0);
        mainLayout->setSpacing(0);
        
        // 左侧区域
        QHBoxLayout* leftLayout = new QHBoxLayout();
        leftLayout->setSpacing(8);
        leftLayout->addWidget(m_iconLabel);
        leftLayout->addWidget(m_titleLabel);
        leftLayout->addStretch();
        
        // 右侧区域
        QHBoxLayout* rightLayout = new QHBoxLayout();
        rightLayout->setSpacing(0);
        rightLayout->addWidget(m_minimizeButton);
        rightLayout->addWidget(m_maximizeButton);
        rightLayout->addWidget(m_closeButton);
        
        mainLayout->addLayout(leftLayout);
        mainLayout->addLayout(rightLayout);
        
        // 设置Topbar的样式
        setStyleSheet(
            "Topbar {"
            "    background-color: #f0f0f0;"
            "    border-bottom: 1px solid #d0d0d0;"
            "}"
        );
    }
    
    void setupConnections() {
        connect(m_minimizeButton, &QPushButton::clicked, this, &CustomTopbar::minimizeClicked, Qt::DirectConnection);
        connect(m_maximizeButton, &QPushButton::clicked, this, &CustomTopbar::maximizeClicked, Qt::DirectConnection);
        connect(m_closeButton, &QPushButton::clicked, this, &CustomTopbar::closeClicked, Qt::DirectConnection);
    }
    
private:
    // 左侧控件
    QLabel* m_iconLabel = nullptr;
    QLabel* m_titleLabel = nullptr;
    
    // 右侧按钮
    QPushButton* m_minimizeButton = nullptr;
    QPushButton* m_maximizeButton = nullptr;
    QPushButton* m_closeButton = nullptr;

    // 拖拽模块
    bool m_isDragging = false;
    QPoint m_dragStartPos{0, 0};
};
```

## 方法二：