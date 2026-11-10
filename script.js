document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#timetable tbody');
    const sortableList = document.getElementById('sortableList');
    const rawInput = document.getElementById('rawInput');
    const separatorSelect = document.getElementById('separator');
    const addBtn = document.getElementById('addBtn');
    const toastMessage = document.getElementById('toastMessage');

    // --- 1. 기본 테이블 생성 로직 ---
    for (let i = 1; i <= 9; i++) {
        const tr = document.createElement('tr');
        const thTime = document.createElement('td');
        thTime.textContent = `${i}교시`;
        tr.appendChild(thTime);

        for (let j = 1; j <= 5; j++) {
            const td = document.createElement('td');
            td.dataset.day = j;
            td.dataset.time = i;
            td.addEventListener('click', function() {
                if (this.classList.contains('filled')) {
                    this.innerHTML = '';
                    this.classList.remove('filled');
                }
            });
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    // --- 2. 드래그 앤 드롭 로직 ---
    let draggedItem = null;

    sortableList.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('sortable-item')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    sortableList.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('sortable-item')) {
            e.target.classList.remove('dragging');
            draggedItem = null;
        }
    });

    sortableList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sortableList, e.clientX);
        if (draggedItem) {
            if (afterElement == null) {
                sortableList.appendChild(draggedItem);
            } else {
                sortableList.insertBefore(draggedItem, afterElement);
            }
        }
    });

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- 3. 스마트 파서 및 데이터 매핑 로직 ---
    function showToast(message) {
        toastMessage.textContent = message;
        toastMessage.classList.add('show');
        setTimeout(() => toastMessage.classList.remove('show'), 2500);
    }

    // 시간 문자열(예: "월 1-2", "화 9:00-11:00")을 요일 인덱스와 교시 배열로 변환
    function parseTimeData(timeStr) {
        const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
        const dayMatch = timeStr.match(/[월화수목금]/);
        if (!dayMatch) return null;
        
        const dayIndex = dayMap[dayMatch[0]];
        let periods = [];

        if (timeStr.includes(':')) {
            // "9:00-11:00" 형태 파싱 (9시를 1교시로 환산)
            const hours = [...timeStr.matchAll(/(\d{1,2}):/g)].map(m => parseInt(m[1]));
            if (hours.length >= 2) {
                let start = hours[0] >= 9 ? hours[0] - 8 : hours[0];
                let end = hours[hours.length - 1] >= 9 ? hours[hours.length - 1] - 8 : hours[hours.length - 1];
                for (let i = start; i < end; i++) periods.push(i);
            }
        } else if (timeStr.includes('-') || timeStr.includes('~')) {
            // "1-3" 형태 파싱
            const nums = timeStr.match(/\d+/g).map(Number);
            if (nums.length >= 2) {
                for (let i = nums[0]; i <= nums[1]; i++) periods.push(i);
            }
        } else {
            // "1, 2" 형태 파싱
            periods = timeStr.match(/\d+/g).map(Number);
        }

        return { dayIndex, periods };
    }

    function addCourseAuto() {
        const text = rawInput.value.trim();
        if (!text) {
            showToast('강의 정보를 입력해 주세요.');
            return;
        }

        const separator = separatorSelect.value;
        const parts = text.split(separator).map(s => s.trim()).filter(s => s !== '');
        
        // 현재 화면에 배치된 드래그 엘리먼트 순서 가져오기
        const currentOrder = [...sortableList.querySelectorAll('.sortable-item')].map(item => item.dataset.type);
        
        let courseData = { name: '', place: '', timeStr: '' };
        
        // 사용자가 설정한 순서대로 parts 배열을 매핑
        currentOrder.forEach((type, index) => {
            if (parts[index]) {
                if (type === 'name') courseData.name = parts[index];
                if (type === 'place') courseData.place = parts[index];
                if (type === 'time') courseData.timeStr = parts[index];
            }
        });

        if (!courseData.name || !courseData.timeStr) {
            showToast('데이터 형식이 맞지 않습니다. 순서와 구분자를 확인해 주세요.');
            return;
        }

        const parsedTime = parseTimeData(courseData.timeStr);
        if (!parsedTime || parsedTime.periods.length === 0) {
            showToast('시간을 인식할 수 없습니다. (예: 월 1,2 또는 월 9:00-11:00)');
            return;
        }

        // 파싱된 교시(여러 개일 수 있음)에 각각 데이터 채워넣기
        parsedTime.periods.forEach(period => {
            const targetCell = document.querySelector(`td[data-day="${parsedTime.dayIndex}"][data-time="${period}"]`);
            if (targetCell) {
                targetCell.innerHTML = `${courseData.name}<span class="course-place">${courseData.place}</span>`;
                targetCell.classList.add('filled');
            }
        });

        rawInput.value = '';
    }

    addBtn.addEventListener('click', addCourseAuto);
    rawInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCourseAuto();
    });
});