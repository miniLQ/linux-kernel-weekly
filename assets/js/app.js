class App {
    constructor() {
        this.reports = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filteredReports = [];
        
        this.init();
    }
    
    async init() {
        await this.loadReports();
        this.bindEvents();
        this.updateStats();
        this.renderDashboard();
        this.updateLastUpdateTime();
    }
    
    async loadReports() {
        try {
            const response = await fetch('reports.json');
            if (!response.ok) throw new Error('Failed to load reports');
            
            this.reports = await response.json();
            this.filteredReports = [...this.reports];
            
            // 按日期排序
            this.reports.sort((a, b) => b.date.localeCompare(a.date));
            this.filteredReports.sort((a, b) => b.date.localeCompare(a.date));
            
            // 更新侧边栏目录
            this.updateSidebarToc();
            
            // 更新报告数量
            document.getElementById('report-count').textContent = this.reports.length;
            
            // 填充年份和月份过滤器
            this.populateFilters();
            
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showError('加载报告失败，请刷新页面重试');
        }
    }
    
    updateSidebarToc() {
        const toc = document.getElementById('reportToc');
        if (!toc) return;
        
        const topReports = this.reports.slice(0, 10);
        
        toc.innerHTML = topReports.map(report => `
            <div class="toc-item" data-filename="${report.filename}">
                <i class="fas fa-file-alt"></i>
                <span>${report.title.replace('Linux Kernel Weekly Report - ', '')}</span>
            </div>
        `).join('');
        
        // 添加点击事件
        toc.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.dataset.filename;
                const report = this.reports.find(r => r.filename === filename);
                if (report) {
                    this.viewReportOnline(report.filename, report.title);
                }
            });
        });
    }
    
    openReport(filename) {
        // 在浏览器中打开原始 markdown 文件
        window.open(filename, '_blank');
    }
    
    updateStats() {
        if (this.reports.length === 0) return;
        
        // 总报告数
        document.getElementById('totalReports').textContent = this.reports.length;
        
        // 最新报告日期
        const latestReport = this.reports[0];
        if (latestReport) {
            const date = latestReport.date.replace(/_/g, '-');
            document.getElementById('latestDate').textContent = date;
            document.getElementById('latestDate').title = latestReport.title;
        }
        
        // 平均大小（模拟）
        const avgSize = Math.round(this.reports.length * 15.5) + ' KB';
        document.getElementById('avgSize').textContent = avgSize;
    }
    
    renderDashboard() {
        this.renderTopReports();
        this.renderReportChart();
        this.renderRecentUpdates();
    }
    
    renderTopReports() {
        const topReportsContainer = document.getElementById('topReports');
        if (!topReportsContainer) return;
        
        const topReports = this.reports.slice(0, 6);
        
        topReportsContainer.innerHTML = topReports.map(report => `
            <div class="report-card">
                <div class="report-card-header">
                    <span class="report-date">${report.date.replace(/_/g, '-')}</span>
                    ${report.is_latest ? '<span class="badge">最新</span>' : ''}
                </div>
                <h4 class="report-title">${report.title}</h4>
                <p class="report-excerpt">${report.description || 'Linux 内核开发周刊报告'}</p>
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="app.viewReportOnline('${report.filename}', '${this.escapeHtml(report.title)}')">
                        <i class="fas fa-eye"></i> 在线阅读
                    </button>
                    <button class="btn btn-secondary" onclick="app.downloadReport('${report.filename}')">
                        <i class="fas fa-download"></i> 下载
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderReportChart() {
        const ctx = document.getElementById('reportChart');
        if (!ctx) return;
        
        // 按月份分组
        const monthlyData = {};
        this.reports.forEach(report => {
            const yearMonth = report.date.substring(0, 6); // YYYY-MM
            monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + 1;
        });
        
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '报告数量',
                    data: data,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    renderRecentUpdates() {
        const container = document.getElementById('recentUpdates');
        if (!container) return;
        
        const recentReports = this.reports.slice(0, 5);
        
        container.innerHTML = recentReports.map(report => `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${report.date.replace(/_/g, '-')}</div>
                    <div class="timeline-title">${report.title}</div>
                </div>
            </div>
        `).join('');
    }
    
    populateFilters() {
        const yearFilter = document.getElementById('yearFilter');
        const monthFilter = document.getElementById('monthFilter');
        
        if (!yearFilter || !monthFilter) return;
        
        // 获取所有年份
        const years = [...new Set(this.reports.map(r => r.date.substring(0, 4)))].sort().reverse();
        
        yearFilter.innerHTML = '<option value="">所有年份</option>' +
            years.map(year => `<option value="${year}">${year}年</option>`).join('');
        
        // 月份选项
        const months = [
            { value: '01', label: '1月' },
            { value: '02', label: '2月' },
            { value: '03', label: '3月' },
            { value: '04', label: '4月' },
            { value: '05', label: '5月' },
            { value: '06', label: '6月' },
            { value: '07', label: '7月' },
            { value: '08', label: '8月' },
            { value: '09', label: '9月' },
            { value: '10', label: '10月' },
            { value: '11', label: '11月' },
            { value: '12', label: '12月' }
        ];
        
        monthFilter.innerHTML = '<option value="">所有月份</option>' +
            months.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
        
        // 绑定过滤器事件
        yearFilter.addEventListener('change', () => this.filterReports());
        monthFilter.addEventListener('change', () => this.filterReports());
    }
    
    filterReports() {
        const year = document.getElementById('yearFilter').value;
        const month = document.getElementById('monthFilter').value;
        
        this.filteredReports = this.reports.filter(report => {
            const reportYear = report.date.substring(0, 4);
            const reportMonth = report.date.substring(4, 6);
            
            if (year && reportYear !== year) return false;
            if (month && reportMonth !== month) return false;
            
            return true;
        });
        
        this.currentPage = 1;
        this.renderReportsGrid();
    }
    
    renderReportsGrid() {
        const container = document.getElementById('reportsGrid');
        if (!container) return;
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageReports = this.filteredReports.slice(start, end);
        
        container.innerHTML = pageReports.map(report => `
            <div class="report-card">
                <div class="report-card-header">
                    <span class="report-date">${report.date.replace(/_/g, '-')}</span>
                    ${report.is_latest ? '<span class="badge">最新</span>' : ''}
                </div>
                <h4 class="report-title">${report.title}</h4>
                <p class="report-excerpt">${report.description || 'Linux 内核开发周刊报告，包含最新补丁、安全修复和开发动态。'}</p>
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="app.viewReportOnline('${report.filename}', '${this.escapeHtml(report.title)}')">
                        <i class="fas fa-eye"></i> 在线阅读
                    </button>
                    <button class="btn btn-secondary" onclick="app.downloadReport('${report.filename}')">
                        <i class="fas fa-download"></i> 下载
                    </button>
                </div>
            </div>
        `).join('');
        
        this.renderPagination();
    }
    
    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.filteredReports.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // 上一页按钮
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="app.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${this.currentPage === i ? 'active' : ''}"
                            onclick="app.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span class="pagination-dots">...</span>';
            }
        }
        
        // 下一页按钮
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="app.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        container.innerHTML = paginationHTML;
    }
    
    changePage(page) {
        this.currentPage = page;
        this.renderReportsGrid();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    downloadReport(filename) {
        const link = document.createElement('a');
        link.href = filename;
        link.download = filename.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    updateLastUpdateTime() {
        const element = document.getElementById('lastUpdate');
        if (element) {
            const now = new Date();
            element.textContent = now.toLocaleString('zh-CN');
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger-color);
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => location.reload());
        }
        
        // 快速操作按钮 - 根据修改后的 index.html 更新
        const quickActions = {
            'readLatestBtn': () => {
                if (this.reports.length > 0) {
                    const latestReport = this.reports[0];
                    this.viewReportOnline(latestReport.filename, latestReport.title);
                }
            },
            'browseAllBtn': () => {
                if (window.sidebar) {
                    sidebar.switchSection('reports');
                }
            },
            'viewStatsBtn': () => {
                if (window.sidebar) {
                    sidebar.switchSection('stats');
                }
            },
            'downloadAllBtn': () => this.downloadAllReports(),
            'readLatestReportBtn': () => {
                if (this.reports.length > 0) {
                    const latestReport = this.reports[0];
                    this.viewReportOnline(latestReport.filename, latestReport.title);
                }
            }
        };
        
        Object.entries(quickActions).forEach(([id, action]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', action);
            }
        });
        
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }
    
    handleSearch(query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (!normalizedQuery) {
            this.filteredReports = [...this.reports];
        } else {
            this.filteredReports = this.reports.filter(report => {
                const title = report.title.toLowerCase();
                const date = report.date.toLowerCase();
                return title.includes(normalizedQuery) || date.includes(normalizedQuery);
            });
        }
        
        this.currentPage = 1;
        
        // 如果当前在报告页面，更新网格
        if (document.getElementById('reports').classList.contains('active')) {
            this.renderReportsGrid();
        }
    }
    
    downloadAllReports() {
        // 创建 ZIP 文件（简化版：提示用户）
        alert('即将提供批量下载功能，目前请逐个下载报告文件。');
    }

    // 在线阅读报告方法
    viewReportOnline(filename, title) {
        // 构建阅读器 URL
        const params = new URLSearchParams({
            file: filename,
            title: encodeURIComponent(title || 'Linux Kernel Weekly Report')
        });
        
        // 打开阅读器页面 - 使用 viewer.html（如果不存在，需要创建）
        window.open(`viewer.html?${params.toString()}`, '_blank');
    }
    
    // 辅助方法：转义 HTML 特殊字符
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// 加载动画控制
window.addEventListener('load', () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
});