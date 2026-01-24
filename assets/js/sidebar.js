class Sidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.menuToggle = document.getElementById('menuToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.navItems = document.querySelectorAll('.nav-item');
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        
        this.init();
    }
    
    init() {
        // 设置初始主题
        this.setTheme(this.currentTheme);
        this.themeToggle.checked = this.currentTheme === 'dark';
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化侧边栏状态
        this.restoreSidebarState();
        
        // 移动端检测
        this.handleMobile();
    }
    
    bindEvents() {
        // 侧边栏切换
        this.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        this.menuToggle?.addEventListener('click', () => this.toggleSidebar());
        
        // 主题切换
        this.themeToggle?.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            this.setTheme(theme);
        });
        
        // 导航项点击
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavClick(e, item));
        });
        
        // 点击外部关闭移动端侧边栏
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !this.sidebar.contains(e.target) && 
                !this.menuToggle.contains(e.target)) {
                this.sidebar.classList.remove('open');
            }
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
    }
    
    toggleSidebar() {
        if (window.innerWidth <= 768) {
            // 移动端：打开/关闭侧边栏
            this.sidebar.classList.toggle('open');
        } else {
            // 桌面端：折叠/展开侧边栏
            this.sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
        }
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // 设置背景颜色 RGB 值用于透明效果
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-primary-rgb', '15, 23, 42');
        } else {
            root.style.setProperty('--bg-primary-rgb', '255, 255, 255');
        }
    }
    
    handleNavClick(e, item) {
        // 移除所有 active 类
        this.navItems.forEach(nav => nav.classList.remove('active'));
        
        // 添加当前 active 类
        item.classList.add('active');
        
        // 获取目标部分
        const section = item.dataset.section;
        if (section) {
            this.switchSection(section);
            
            // 更新面包屑
            const sectionName = item.querySelector('span').textContent;
            document.getElementById('currentSection').textContent = sectionName;
            
            // 移动端：点击后关闭侧边栏
            if (window.innerWidth <= 768) {
                this.sidebar.classList.remove('open');
            }
        }
    }
    
    switchSection(sectionId) {
        // 隐藏所有部分
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 显示目标部分
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    restoreSidebarState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            this.sidebar.classList.add('collapsed');
        }
    }
    
    handleMobile() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('collapsed');
        }
    }
    
    handleResize() {
        this.handleMobile();
        
        // 如果从移动端切换到桌面端，关闭移动端菜单
        if (window.innerWidth > 768) {
            this.sidebar.classList.remove('open');
        }
    }
}

// 初始化侧边栏
document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
});