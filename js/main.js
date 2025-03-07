// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面组件
    initComponents();
    
    // 根据当前页面加载特定功能
    if (document.querySelector('.plan-editor')) {
        initPlanEditor();
    }
    
    if (document.querySelector('#discoverCards')) {
        initDiscoverPage();
    }
});

// 初始化通用组件
function initComponents() {
    // 登录/注册按钮事件
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('登录/注册功能即将上线！');
        });
    }
    
    // 添加导航栏动画效果
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 初始化旅行计划编辑器
function initPlanEditor() {
    // 编辑器工具栏功能
    const btnBold = document.getElementById('btnBold');
    const btnItalic = document.getElementById('btnItalic');
    const btnImage = document.getElementById('btnImage');
    const btnEmoji = document.getElementById('btnEmoji');
    const editor = document.getElementById('planDescription');
    const imageUpload = document.getElementById('imageUpload');
    
    if (btnBold) {
        btnBold.addEventListener('click', function() {
            document.execCommand('bold', false, null);
            editor.focus();
        });
    }
    
    if (btnItalic) {
        btnItalic.addEventListener('click', function() {
            document.execCommand('italic', false, null);
            editor.focus();
        });
    }
    
    if (btnImage && imageUpload) {
        btnImage.addEventListener('click', function() {
            imageUpload.click();
        });
        
        imageUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.execCommand('insertImage', false, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 支持粘贴图片
    if (editor) {
        editor.addEventListener('paste', function(e) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.execCommand('insertImage', false, e.target.result);
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                    break;
                }
            }
        });
    }
    
    // 保存和发布按钮
    const savePlanBtn = document.getElementById('savePlan');
    const publishPlanBtn = document.getElementById('publishPlan');
    
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', function() {
            savePlan('draft');
        });
    }
    
    if (publishPlanBtn) {
        publishPlanBtn.addEventListener('click', function() {
            savePlan('published');
        });
    }
    
    // 加载已保存的计划
    loadSavedPlans();
}

// 保存计划函数
function savePlan(status) {
    const title = document.getElementById('planTitle').value;
    const startLocation = document.getElementById('startLocation').value;
    const destination = document.getElementById('destination').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const content = document.getElementById('planDescription').innerHTML;
    
    if (!title || !startLocation || !destination || !startDate || !endDate) {
        alert('请填写完整的旅行计划信息！');
        return;
    }
    
    const plan = {
        id: Date.now(),
        title,
        startLocation,
        destination,
        startDate,
        endDate,
        content,
        status,
        createdAt: new Date().toISOString()
    };
    
    // 保存到本地存储
    let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
    plans.push(plan);
    localStorage.setItem('travelPlans', JSON.stringify(plans));
    
    // 如果是发布状态，同时保存到发现页面的数据
    if (status === 'published') {
        let discoveries = JSON.parse(localStorage.getItem('travelDiscoveries') || '[]');
        discoveries.push({
            id: plan.id,
            title: plan.title,
            destination: plan.destination,
            date: plan.startDate,
            content: plan.content,
            image: extractFirstImage(plan.content) || 'images/default.jpg',
            likes: 0,
            comments: 0,
            user: {
                avatar: 'images/avatar-default.jpg',
                name: '旅行者' + Math.floor(Math.random() * 1000)
            }
        });
        localStorage.setItem('travelDiscoveries', JSON.stringify(discoveries));
    }
    
    alert(status === 'published' ? '计划已发布！' : '计划已保存！');
    loadSavedPlans();
    
    // 清除表单
    if (status === 'published') {
        document.getElementById('planTitle').value = '';
        document.getElementById('startLocation').value = '';
        document.getElementById('destination').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('planDescription').innerHTML = '';
    }
}

// 从HTML内容中提取第一张图片
function extractFirstImage(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const img = doc.querySelector('img');
    return img ? img.src : null;
}

// 加载已保存的计划
function loadSavedPlans() {
    const savedPlansList = document.getElementById('savedPlansList');
    if (!savedPlansList) return;
    
    const plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
    
    if (plans.length === 0) {
        savedPlansList.innerHTML = '<div class="text-center text-muted"><p>暂无保存的计划</p></div>';
        return;
    }
    
    savedPlansList.innerHTML = '';
    
    // 显示最新的5个计划
    plans.slice(-5).reverse().forEach(plan => {
        const planItem = document.createElement('div');
        planItem.className = 'saved-plan-item';
        planItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${plan.title}</h6>
                <span class="badge ${plan.status === 'published' ? 'bg-success' : 'bg-secondary'}">${plan.status === 'published' ? '已发布' : '草稿'}</span>
            </div>
            <div class="small text-muted">${plan.startLocation} → ${plan.destination}</div>
            <div class="small text-muted">${plan.startDate} 至 ${plan.endDate}</div>
            <hr>
        `;
        
        planItem.addEventListener('click', function() {
            loadPlanToEditor(plan);
        });
        
        savedPlansList.appendChild(planItem);
    });
}

// 将保存的计划加载到编辑器
function loadPlanToEditor(plan) {
    document.getElementById('planTitle').value = plan.title;
    document.getElementById('startLocation').value = plan.startLocation;
    document.getElementById('destination').value = plan.destination;
    document.getElementById('startDate').value = plan.startDate;
    document.getElementById('endDate').value = plan.endDate;
    document.getElementById('planDescription').innerHTML = plan.content;
}

// 初始化发现页面
function initDiscoverPage() {
    // 加载发现数据
    loadDiscoveries();
    
    // 搜索按钮事件
    const searchBtn = document.getElementById('btnSearch');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            loadDiscoveries(true);
        });
    }
    
    // 加载更多按钮
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreDiscoveries();
        });
    }
}

// 加载发现页面数据
function loadDiscoveries(isSearch = false) {
    const discoverCards = document.getElementById('discoverCards');
    if (!discoverCards) return;
    
    // 从本地存储获取数据
    let discoveries = JSON.parse(localStorage.getItem('travelDiscoveries') || '[]');
    
    // 如果是搜索，则进行筛选
    if (isSearch) {
        const searchText = document.getElementById('searchDiscover').value.toLowerCase();
        const regionFilter = document.getElementById('filterRegion').value;
        const typeFilter = document.getElementById('filterType').value;
        
        if (searchText || regionFilter || typeFilter) {
            discoveries = discoveries.filter(item => {
                const matchSearch = !searchText || item.title.toLowerCase().includes(searchText) || 
                                   item.destination.toLowerCase().includes(searchText) || 
                                   item.user.name.toLowerCase().includes(searchText);
                                   
                const matchRegion = !regionFilter || item.region === regionFilter;
                const matchType = !typeFilter || item.type === typeFilter;
                
                return matchSearch && matchRegion && matchType;
            });
        }
    }
    
    // 如果没有数据，显示默认内容
    if (discoveries.length === 0 && isSearch) {
        discoverCards.innerHTML = '<div class="col-12 text-center my-5"><h4>未找到相关内容</h4></div>';
        return;
    }
    
    // 显示前6个发现
    discoverCards.innerHTML = '';
    const maxDisplay = Math.min(6, discoveries.length);
    
    for (let i = 0; i < maxDisplay; i++) {
        const discovery = discoveries[i];
        const card = createDiscoveryCard(discovery);
        discoverCards.appendChild(card);
    }
        // 更新加载更多按钮的显示状态
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = discoveries.length > maxDisplay ? 'inline-block' : 'none';
    }
}

// 加载更多发现
function loadMoreDiscoveries() {
    const discoverCards = document.getElementById('discoverCards');
    const currentCount = discoverCards.children.length;
    
    // 从本地存储获取数据
    const discoveries = JSON.parse(localStorage.getItem('travelDiscoveries') || '[]');
    
    // 加载更多6个或剩余全部
    const maxDisplay = Math.min(currentCount + 6, discoveries.length);
    
    for (let i = currentCount; i < maxDisplay; i++) {
        const discovery = discoveries[i];
        const card = createDiscoveryCard(discovery);
        discoverCards.appendChild(card);
    }
    
    // 更新加载更多按钮的显示状态
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = discoveries.length > maxDisplay ? 'inline-block' : 'none';
    }
}

// 创建发现卡片元素
function createDiscoveryCard(discovery) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    col.innerHTML = `
        <div class="card discover-card">
            <img src="${discovery.image}" class="card-img-top" alt="${discovery.title}">
            <div class="card-body">
                <h5 class="card-title">${discovery.title}</h5>
                <p class="card-text">${getShortDescription(discovery.content)}</p>
                <div class="card-info">
                    <span><i class="fas fa-map-marker-alt"></i> ${discovery.destination}</span>
                    <span><i class="far fa-calendar-alt"></i> ${discovery.date}</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="user-info">
                    <img src="${discovery.user.avatar}" alt="${discovery.user.name}" class="avatar">
                    <span>${discovery.user.name}</span>
                </div>
                <div class="card-actions">
                    <span class="like-btn" data-id="${discovery.id}"><i class="far fa-heart"></i> ${discovery.likes}</span>
                    <span><i class="far fa-comment"></i> ${discovery.comments}</span>
                </div>
            </div>
        </div>
    `;
    
    // 添加点赞功能
    const likeBtn = col.querySelector('.like-btn');
    likeBtn.addEventListener('click', function() {
        const id = this.dataset.id;
        likeDiscovery(id, this);
    });
    
    return col;
}

// 从HTML内容中提取短描述
function getShortDescription(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent || "";
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}

// 点赞功能
function likeDiscovery(id, element) {
    let discoveries = JSON.parse(localStorage.getItem('travelDiscoveries') || '[]');
    const index = discoveries.findIndex(d => d.id.toString() === id);
    
    if (index !== -1) {
        discoveries[index].likes++;
        localStorage.setItem('travelDiscoveries', JSON.stringify(discoveries));
        
        // 更新UI
        const icon = element.querySelector('i');
        icon.className = 'fas fa-heart';
        element.innerHTML = `<i class="fas fa-heart"></i> ${discoveries[index].likes}`;
    }
}