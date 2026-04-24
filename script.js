// 全局变量
let allData = [];
let currentPage = 1;
let pageSize = 15;
let sortColumn = '';
let sortDirection = 'asc';
let chartInstance = null;

// 生成更多监控数据
function generateMonitorData() {
    const data = [];
    const companies = ['研发部', '天津石化', '辽河石化', '大港石化', '上海石化', '天津因科'];
    const devices = ['王水实验管件1#', '王水实验管件2#', '2#常减压', '焦化装置', '减顶空冷EC-107/1', '常压塔T-102'];
    const locations = ['1#管件', '2#管件', '3#管件', '常压塔T-102至空冷器EC-101管线', '1号弯头', 'A3101B分馏塔顶空冷南侧入口管线', '常顶空冷EC-101进口管线', '实验室直管'];
    const riskLevels = ['一级', '二级', '三级'];
    
    for (let i = 1; i <= 50; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const device = devices[Math.floor(Math.random() * devices.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        
        // 生成随机日期（过去1年内）
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        const formattedDate = date.toISOString().split('T')[0];
        
        // 生成随机数值
        const minBh = (Math.random() * 8 + 1).toFixed(2);
        const fsSpeed = (Math.random() * 5).toFixed(2);
        const jbRate = (Math.random() * 100).toFixed(2) + '%';
        const remainLife = Math.random() > 0.5 ? (Math.random() * 20).toFixed(1) : '--';
        const status = Math.random() > 0.3 ? '正常' : '';
        
        data.push({
            id: `L${100 + i}`,
            seq: i,
            riskLevel: riskLevel,
            orgName: company,
            device: device,
            location: location,
            date: formattedDate,
            minBh: minBh,
            fsSpeed: fsSpeed,
            jbRate: jbRate,
            remainLife: remainLife,
            status: status,
            locCode: `${company.substring(0, 2).toUpperCase()}${String(i).padStart(3, '0')}`,
            allowMinBh: (Math.random() * 3 + 1).toFixed(1),
            tyDate: formattedDate,
            jkStartDate: formattedDate,
            jkDays: Math.floor(Math.random() * 1000),
            ljbj: `${Math.floor(Math.random() * 365)}天`,
            warnDealed: Math.random() > 0.5 ? '已处理' : '待处理'
        });
    }
    
    return data;
}

// 监控数据
const monitorData = generateMonitorData();

$(document).ready(function() {
    allData = monitorData;
    
    // 解析URL参数并恢复状态
    parseUrlParams();
    
    // 初始化UI
    initUI();
    
    // 加载初始数据
    loadData();
    
    // 初始化图表
    initChart();
    
    // 绑定事件
    bindEvents();
});

// 解析URL参数并恢复状态
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 恢复搜索关键词
    const keyword = urlParams.get('keyword');
    if (keyword) {
        $('#searchKeyword').val(keyword);
    }
    
    // 恢复页码
    const page = urlParams.get('page');
    if (page) {
        currentPage = parseInt(page);
    }
    
    // 恢复排序
    const sort = urlParams.get('sort');
    const dir = urlParams.get('dir');
    if (sort && dir) {
        sortColumn = sort;
        sortDirection = dir;
    }
}

function initUI() {
    // 初始化排序图标
    initSortIcons();
    
    // 初始化复选框切换
    initCheckboxToggles();
}

function loadData() {
    // 筛选数据
    let filteredData = filterData(allData);
    
    // 排序数据
    filteredData = sortData(filteredData);
    
    // 分页数据
    const paginatedData = paginateData(filteredData, currentPage, pageSize);
    
    // 渲染表格
    renderTable(paginatedData);
    
    // 更新分页控件
    updatePagination(filteredData.length);
}

// 绑定分页事件
function bindPaginationEvents() {
    // 分页点击
    $('.pagination li[page]').on('click', function() {
        const page = parseInt($(this).attr('page'));
        const totalPages = Math.ceil(allData.length / pageSize);
        if (page && page <= totalPages && page !== currentPage) {
            currentPage = page;
            loadData();
        }
    });
    
    // 处理...点击
    $('.pagination li').not('[page]').not(':first-child').not(':last-child').on('click', function() {
        // 点击...时，展开中间的几页，替换最前面的按钮
        const totalPages = Math.ceil(allData.length / pageSize);
        const middlePage = Math.floor(totalPages / 2);
        
        // 重新生成分页控件
        const pagination = $('#page1');
        pagination.empty();
        
        // 添加上一页按钮
        pagination.append('<li><a>上一页</a></li>');
        
        // 添加中间页面按钮
        for (let i = middlePage - 2; i <= middlePage + 2; i++) {
            if (i >= 1 && i <= totalPages) {
                if (i === currentPage) {
                    pagination.append(`<li class="active" page="${i}"><a>${i}</a></li>`);
                } else {
                    pagination.append(`<li page="${i}"><a>${i}</a></li>`);
                }
            }
        }
        
        // 添加下一页按钮
        pagination.append('<li><a>下一页</a></li>');
        
        // 重新绑定事件
        bindPaginationEvents();
    });
    
    // 上一页/下一页
    $('.pagination li:first-child, .pagination li:last-child').on('click', function() {
        const totalPages = Math.ceil(allData.length / pageSize);
        
        if ($(this).find('a').text() === '上一页') {
            if (currentPage > 1) {
                currentPage--;
                loadData();
            }
        } else if ($(this).find('a').text() === '下一页') {
            if (currentPage < totalPages) {
                currentPage++;
                loadData();
            }
        }
    });
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination = $('#page1');
    
    // 清空分页控件
    pagination.empty();
    
    // 添加上一页按钮
    pagination.append('<li><a>上一页</a></li>');
    
    // 添加页码按钮
    if (totalPages <= 5) {
        // 如果总页数小于等于5，显示所有页码
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                pagination.append(`<li class="active" page="${i}"><a>${i}</a></li>`);
            } else {
                pagination.append(`<li page="${i}"><a>${i}</a></li>`);
            }
        }
    } else {
        // 如果总页数大于5，显示前3页，然后是...，然后是最后一页
        for (let i = 1; i <= 3; i++) {
            if (i === currentPage) {
                pagination.append(`<li class="active" page="${i}"><a>${i}</a></li>`);
            } else {
                pagination.append(`<li page="${i}"><a>${i}</a></li>`);
            }
        }
        
        // 添加...
        pagination.append('<li><a>...</a></li>');
        
        // 添加最后一页
        if (currentPage === totalPages) {
            pagination.append(`<li class="active" page="${totalPages}"><a>${totalPages}</a></li>`);
        } else {
            pagination.append(`<li page="${totalPages}"><a>${totalPages}</a></li>`);
        }
    }
    
    // 添加下一页按钮
    pagination.append('<li><a>下一页</a></li>');
    
    // 重新绑定事件
    bindPaginationEvents();
}

function filterData(data) {
    const keyword = $('#searchKeyword').val().trim().toLowerCase();
    
    if (!keyword) {
        return data;
    }
    
    return data.filter(item => {
        return item.locCode.toLowerCase().includes(keyword) ||
               item.orgName.toLowerCase().includes(keyword) ||
               item.device.toLowerCase().includes(keyword) ||
               item.location.toLowerCase().includes(keyword);
    });
}

function sortData(data) {
    if (!sortColumn) {
        return data;
    }
    
    const columnMap = {
        'MIN_BH': 'minBh',
        'FS_SPPED_AVG': 'fsSpeed',
        'JB_RATE': 'jbRate'
    };
    
    const sortKey = columnMap[sortColumn] || sortColumn;
    
    return data.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
        // 处理百分比字符串
        if (typeof valA === 'string' && valA.includes('%')) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }
        
        // 处理数字字符串
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function paginateData(data, page, size) {
    const start = (page - 1) * size;
    const end = start + size;
    return data.slice(start, end);
}

function renderTable(data) {
    const tbody = $('#tableBody');
    tbody.empty();
    
    data.forEach((item, index) => {
        const riskClass = getRiskClass(item.riskLevel);
        
        const row = `
            <tr class="rowData" data-id="${item.id}" style="cursor: pointer;">
                <td colcode="SEQ">
                    <p>${item.seq}</p>
                    <input type="hidden" colcode="LOC_ID" value="${item.id}">
                </td>
                <td colcode="RISK_LEVEL">
                    <p class="risk-level ${riskClass}">${item.riskLevel}</p>
                </td>
                <td colcode="ORG_CODE__NAME">${item.orgName}</td>
                <td colcode="ZZ_NAME">${item.device}</td>
                <td style="text-align: left">
                    <p class="text-ellipsis" style="width:150px;" colcode="LOC_NAME" title="${item.location}">${item.location}</p>
                </td>
                <td colcode="OMR_DATE">${item.date}</td>
                <td colcode="MIN_BH">${item.minBh}</td>
                <td colcode="FS_SPPED_AVG">${item.fsSpeed}</td>
                <td colcode="JB_RATE">${item.jbRate}</td>
                <td colcode="SYSM_YEARS">${item.remainLife}</td>
                <td colcode="LOC_STATE">${item.status}</td>
                <td colcode="LOC_CODE" class="ext-header hidden">${item.locCode}</td>
                <td colcode="ALLOW_MIN_BH" class="ext-header hidden">${item.allowMinBh}</td>
                <td colcode="TY_DATE" class="ext-header hidden">${item.tyDate}</td>
                <td colcode="JK_START_DATE" class="ext-header hidden">${item.jkStartDate}</td>
                <td colcode="JK_DAYS" class="ext-header hidden">${item.jkDays}</td>
                <td colcode="LJBJ" class="ext-header hidden">${item.ljbj}</td>
                <td colcode="WARN_DEALED" class="ext-header hidden">${item.warnDealed}</td>
                <td><a href="javascript:;" class="detail-link" data-id="${item.id}">详情</a></td>
            </tr>
        `;
        
        tbody.append(row);
    });
    
    // 绑定详情链接点击
    $('.detail-link').on('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        const id = $(this).data('id');
        showDetail(id);
    });
    
    // 绑定表格行点击
    $('.rowData').on('click', function() {
        // 移除所有行的选中状态
        $('.rowData').removeClass('selected');
        // 添加当前行的选中状态
        $(this).addClass('selected');
        const id = $(this).data('id');
        showDetail(id);
    });
    
    // 绑定表格行双击，跳转到三级页面
    $('.rowData').on('dblclick', function() {
        const id = $(this).data('id');
        // 获取当前状态参数
        const searchKeyword = $('#searchKeyword').val();
        const currentPageNum = currentPage;
        const sortCol = sortColumn;
        const sortDir = sortDirection;
        
        // 跳转到pipe_detail.html页面，并传递ID和状态参数
        window.location.href = `pipe_detail.html?id=${id}&keyword=${encodeURIComponent(searchKeyword)}&page=${currentPageNum}&sort=${sortCol}&dir=${sortDir}`;
    });
}

function getRiskClass(level) {
    switch(level) {
        case '一级': return 'yiji';
        case '二级': return 'erji';
        case '三级': return 'sanji';
        default: return '';
    }
}

function initSortIcons() {
    $('.sort-header .icon').on('click', function(e) {
        e.stopPropagation();
        
        const header = $(this).closest('th');
        const colCode = header.find('p').attr('colcode');
        const iconType = $(this).hasClass('sheng') ? 'asc' : 'desc';
        
        // 移除所有图标的活动状态
        $('.sort-header .icon').removeClass('active');
        
        // 设置活动状态
        $(this).addClass('active');
        
        // 设置排序列和方向
        sortColumn = colCode;
        sortDirection = iconType;
        
        // 重新加载数据
        loadData();
    });
}

function initCheckboxToggles() {
    $('#searchKeyword').on('input', function() {
        loadData();
    });
    
    $('#searchBtn').on('click', function() {
        loadData();
    });
    
    // 切换扩展列
    $('.top2_bb input[type="checkbox"]').on('change', function() {
        const colCode = $(this).val();
        const isChecked = $(this).is(':checked');
        
        // 切换表头列可见性
        const headerIndex = getHeaderIndex(colCode);
        if (headerIndex !== -1) {
            const headerCells = $('.list_table thead th');
            if (isChecked) {
                headerCells.eq(headerIndex).removeClass('hidden');
            } else {
                headerCells.eq(headerIndex).addClass('hidden');
            }
        }
        
        // 切换表体列可见性
        $(`.list_table td[colcode="${colCode}"]`).each(function() {
            if (isChecked) {
                $(this).removeClass('hidden');
            } else {
                $(this).addClass('hidden');
            }
        });
    });
    
    // 切换选项下拉菜单
    $('.top2_tt').on('click', function() {
        $(this).toggleClass('active');
        $('.top2_bb').toggle();
    });
    
    // 点击外部关闭下拉菜单
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.left_top2').length) {
            $('.top2_tt').removeClass('active');
            $('.top2_bb').hide();
        }
    });
    

    

    

    
    // 页面跳转
    $('.pageJump button').on('click', function() {
        const page = parseInt($('.pageJump input').val());
        const totalPages = Math.ceil(allData.length / pageSize);
        
        if (page && page >= 1 && page <= totalPages) {
            currentPage = page;
            loadData();
            
            // 更新分页活动状态
            $('.pagination li').removeClass('active');
            $(`.pagination li[page="${currentPage}"]`).addClass('active');
        }
    });
    
    $('.pageJump input').on('keypress', function(e) {
        if (e.which === 13) {
            $('.pageJump button').click();
        }
    });
}

function getHeaderIndex(colCode) {
    const columns = ['SEQ', 'RISK_LEVEL', 'ORG_CODE__NAME', 'ZZ_NAME', 'LOC_NAME', 'OMR_DATE', 
                     'MIN_BH', 'FS_SPPED_AVG', 'JB_RATE', 'SYSM_YEARS', 'LOC_STATE',
                     'LOC_CODE', 'ALLOW_MIN_BH', 'TY_DATE', 'JK_START_DATE', 'JK_DAYS', 'LJBJ', 'WARN_DEALED', ''];
    
    for (let i = 0; i < columns.length; i++) {
        if (columns[i] === colCode) {
            return i;
        }
    }
    return -1;
}

function showDetail(id) {
    const item = allData.find(d => d.id === id);
    
    if (!item) return;
    
    // 更新位置名称
    $('.right1_top p').text(item.location);
    
    // 更新图表数据
    updateChartData(item.id);
    
    // 显示详情面板
    $('.con_right').addClass('visible');
    $('.con_right').css('visibility', 'visible');
    
    // 切换图片视图
    $('.choose1').addClass('active');
    $('.choose2').removeClass('active');
    $('.tupian').show();
    $('.tupian1').hide();
}

function initChart() {
    const chartDom = document.getElementById('zhexian');
    if (!chartDom) return;
    
    chartInstance = echarts.init(chartDom);
    
    // 添加resize事件监听器
    window.addEventListener('resize', function() {
        chartInstance.resize();
    });
    
    // 默认图表数据
    const dates = ['2026-01-19', '2026-02-03', '2026-02-18', '2026-03-04', '2026-03-19', '2026-04-03', '2026-04-18'];
    const values = [6.5, 6.3, 6.1, 5.9, 5.8, 5.8, 5.84];
    
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                return params[0].axisValue + '<br/>' +
                       '壁厚: ' + params[0].value + ' mm';
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            top: '3%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#999' } },
            axisLabel: { 
                fontSize: 10, 
                color: '#666',
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#eee' } },
            axisLabel: { fontSize: 10, color: '#666' }
        },
        series: [{
            name: '壁厚',
            type: 'line',
            smooth: false,
            symbol: 'circle',
            symbolSize: 6,
            data: values,
            lineStyle: {
                color: '#0066cc',
                width: 2
            },
            itemStyle: {
                color: '#0066cc'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(0, 102, 204, 0.3)' },
                    { offset: 1, color: 'rgba(0, 102, 204, 0.05)' }
                ])
            }
        }]
    };
    
    chartInstance.setOption(option);
    
    // 窗口大小改变时调整图表
    window.addEventListener('resize', function() {
        chartInstance.resize();
    });
}

function updateChartData(id) {
    // 根据ID模拟不同数据
    const dates = ['2026-01-19', '2026-02-03', '2026-02-18', '2026-03-04', '2026-03-19', '2026-04-03', '2026-04-18'];
    const baseValue = 6.5 + Math.random() * 1.5;
    const values = dates.map((_, i) => (baseValue - i * 0.08).toFixed(2));
    
    const option = {
        xAxis: {
            data: dates,
            axisLabel: { 
                rotate: 45
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: values,
            smooth: false,
            lineStyle: {
                color: '#0066cc'
            },
            itemStyle: {
                color: '#0066cc'
            }
        }]
    };
    
    chartInstance.setOption(option);
}

function bindEvents() {
    // 图片切换
    $('.choose1, .choose2').on('click', function() {
        if ($(this).hasClass('choose1')) {
            $(this).addClass('active');
            $('.choose2').removeClass('active');
            $('.tupian').show();
            $('.tupian1').hide();
        } else {
            $(this).addClass('active');
            $('.choose1').removeClass('active');
            $('.tupian').hide();
            $('.tupian1').show();
        }
    });
    
    // 图表类型切换
    $('.bh_type_con a').on('click', function() {
        $('.bh_type_con a').removeClass('cur');
        $(this).addClass('cur');
        
        const type = $(this).attr('bh_type');
        // 根据类型更新图表
        updateChartByType(type);
    });
    
    // 返回首页按钮点击事件
    $('#backToMain').on('click', function() {
        // 跳转到一级界面
        window.location.href = 'index.html';
    });
}

function updateChartByType(type) {
    let dates, values;
    
    switch(type) {
        case 'day':
            dates = ['2026-01-19', '2026-02-03', '2026-02-18', '2026-03-04', '2026-03-19', '2026-04-03', '2026-04-18'];
            values = [6.5, 6.3, 6.1, 5.9, 5.8, 5.8, 5.84];
            break;
        case 'week':
            dates = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'];
            values = [6.5, 6.4, 6.3, 6.2, 6.1, 6.0, 5.9, 5.84];
            break;
        case 'month':
            dates = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            values = [6.5, 6.4, 6.3, 6.2, 6.1, 6.0, 5.9, 5.85, 5.84, 5.84, 5.84, 5.84];
            break;
    }
    
    const option = {
        xAxis: {
            data: dates,
            axisLabel: { 
                rotate: type === 'day' ? 45 : 0
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: values,
            smooth: false,
            lineStyle: {
                color: '#0066cc'
            },
            itemStyle: {
                color: '#0066cc'
            }
        }]
    };
    
    chartInstance.setOption(option);
}
