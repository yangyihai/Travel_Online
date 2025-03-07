// 百度地图API相关功能
let map = null;
let currentMode = 'driving'; // 默认驾车模式

// 初始化地图
function initMap() {
    // 创建地图实例
    map = new BMap.Map("mapContainer");
    
    // 创建点坐标
    const point = new BMap.Point(116.404, 39.915); // 默认北京中心点
    
    // 初始化地图，设置中心点坐标和地图级别
    map.centerAndZoom(point, 12);
    
    // 添加地图控件
    map.addControl(new BMap.NavigationControl()); // 添加平移缩放控件
    map.addControl(new BMap.ScaleControl());      // 添加比例尺控件
    map.addControl(new BMap.OverviewMapControl()); // 添加缩略图控件
    
    // 设置地图缩放级别
    map.enableScrollWheelZoom(); // 启用滚轮缩放
    
    // 获取当前位置
    getCurrentLocation();
}

// 获取当前位置
function getCurrentLocation() {
    const geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
        if(this.getStatus() == BMAP_STATUS_SUCCESS){
            const mk = new BMap.Marker(r.point);
            map.addOverlay(mk);
            map.panTo(r.point);
            
            // 更新出发地输入框
            const geocoder = new BMap.Geocoder();
            geocoder.getLocation(r.point, function(result){
                if (result) {
                    document.getElementById('startLocation').value = result.address;
                }
            });
        }
        else {
            console.log('获取当前位置失败，错误码：' + this.getStatus());
        }        
    }, {enableHighAccuracy: true});
}

// 规划路线
function planRoute() {
    const startLocation = document.getElementById('startLocation').value;
    const destination = document.getElementById('destination').value;
    
    if (!startLocation || !destination) {
        alert('请输入出发地和目的地');
        return;
    }
    
    // 清除之前的路线
    map.clearOverlays();
    
    // 创建地址解析器实例
    const myGeo = new BMap.Geocoder();
    
    // 解析起点地址
    myGeo.getPoint(startLocation, function(startPoint){
        if (startPoint) {
            // 解析终点地址
            myGeo.getPoint(destination, function(endPoint){
                if (endPoint) {
                    // 添加起点和终点标记
                    addMarkers(startPoint, endPoint);
                    
                    // 根据当前模式规划路线
                    switch(currentMode) {
                        case 'driving':
                            planDrivingRoute(startPoint, endPoint);
                            break;
                        case 'transit':
                            planTransitRoute(startPoint, endPoint);
                            break;
                        case 'walking':
                            planWalkingRoute(startPoint, endPoint);
                            break;
                    }
                } else {
                    alert('无法解析目的地地址');
                }
            }, destination);
        } else {
            alert('无法解析出发地地址');
        }
    }, startLocation);
}

// 添加起点和终点标记
function addMarkers(startPoint, endPoint) {
    // 创建起点标注
    const startMarker = new BMap.Marker(startPoint);
    startMarker.setLabel(new BMap.Label('起点', {offset: new BMap.Size(20, -10)}));
    map.addOverlay(startMarker);
    
    // 创建终点标注
    const endMarker = new BMap.Marker(endPoint);
    endMarker.setLabel(new BMap.Label('终点', {offset: new BMap.Size(20, -10)}));
    map.addOverlay(endMarker);
    
    // 调整视图以适应两点
    const viewPort = map.getViewport([startPoint, endPoint]);
    map.centerAndZoom(viewPort.center, viewPort.zoom);
}

// 规划驾车路线
function planDrivingRoute(startPoint, endPoint) {
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>路线规划中...</p></div>';
    
    const driving = new BMap.DrivingRoute(map, {
        renderOptions: {
            map: map,
            autoViewport: true
        },
        onSearchComplete: function(results) {
            if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
                const plan = results.getPlan(0);
                let info = `
                    <h6>驾车路线</h6>
                    <p><strong>总距离：</strong>${plan.getDistance(true)}</p>
                    <p><strong>预计时间：</strong>${plan.getDuration(true)}</p>
                    <div class="route-steps">`;
                
                const steps = plan.getRoute(0).getStep();
                for (let i = 0; i < Math.min(steps.length, 3); i++) {
                    info += `<p class="small">${i+1}. ${steps[i].getDescription(true)}</p>`;
                }
                
                if (steps.length > 3) {
                    info += `<p class="small text-muted">...</p>`;
                }
                
                info += `</div>`;
                routeInfo.innerHTML = info;
            } else {
                routeInfo.innerHTML = '<div class="alert alert-danger">路线规划失败，请重试</div>';
            }
        }
    });
    driving.search(startPoint, endPoint);
}

// 规划公交路线
function planTransitRoute(startPoint, endPoint) {
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>路线规划中...</p></div>';
    
    const transit = new BMap.TransitRoute(map, {
        renderOptions: {
            map: map,
            autoViewport: true
        },
        onSearchComplete: function(results) {
            if (transit.getStatus() == BMAP_STATUS_SUCCESS) {
                const plan = results.getPlan(0);
                let info = `
                    <h6>公交路线</h6>
                    <p><strong>总距离：</strong>${plan.getDistance(true)}</p>
                    <p><strong>预计时间：</strong>${plan.getDuration(true)}</p>
                    <div class="route-steps">`;
                
                const lines = [];
                const steps = plan.getNumLines();
                for (let i = 0; i < steps; i++) {
                    const line = plan.getLine(i);
                    lines.push(line.title);
                }
                
                for (let i = 0; i < Math.min(lines.length, 3); i++) {
                    info += `<p class="small">${i+1}. ${lines[i]}</p>`;
                }
                
                if (lines.length > 3) {
                    info += `<p class="small text-muted">...</p>`;
                }
                
                info += `</div>`;
                routeInfo.innerHTML = info;
            } else {
                routeInfo.innerHTML = '<div class="alert alert-danger">路线规划失败，请重试</div>';
            }
        }
    });
    transit.search(startPoint, endPoint);
}

// 规划步行路线
function planWalkingRoute(startPoint, endPoint) {
    const routeInfo = document.getElementById('routeInfo');
    routeInfo.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>路线规划中...</p></div>';
    
    const walking = new BMap.WalkingRoute(map, {
        renderOptions: {
            map: map,
            autoViewport: true
        },
        onSearchComplete: function(results) {
            if (walking.getStatus() == BMAP_STATUS_SUCCESS) {
                const plan = results.getPlan(0);
                let info = `
                    <h6>步行路线</h6>
                    <p><strong>总距离：</strong>${plan.getDistance(true)}</p>
                    <p><strong>预计时间：</strong>${plan.getDuration(true)}</p>
                    <div class="route-steps">`;
                
                const steps = plan.getRoute(0).getStep();
                for (let i = 0; i < Math.min(steps.length, 3); i++) {
                    info += `<p class="small">${i+1}. ${steps[i].getDescription(true)}</p>`;
                }
                
                if (steps.length > 3) {
                    info += `<p class="small text-muted">...</p>`;
                }
                
                info += `</div>`;
                routeInfo.innerHTML = info;
            } else {
                routeInfo.innerHTML = '<div class="alert alert-danger">路线规划失败，请重试</div>';
            }
        }
    });
    walking.search(startPoint, endPoint);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果存在地图容器，则初始化地图
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        initMap();
        
        // 规划路线按钮事件
        const planRouteBtn = document.getElementById('planRoute');
        if (planRouteBtn) {
            planRouteBtn.addEventListener('click', planRoute);
        }
        
        // 路线模式切换事件
        const routeModeButtons = document.querySelectorAll('.route-options .btn');
        routeModeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // 移除所有按钮的激活状态
                routeModeButtons.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的激活状态
                this.classList.add('active');
                // 更新当前模式
                currentMode = this.dataset.mode;
            });
        });
    }
});