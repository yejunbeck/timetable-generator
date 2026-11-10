document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#timetable tbody');
    const sortableList = document.getElementById('sortableList');
    const rawInput = document.getElementById('rawInput');
    const separatorSelect = document.getElementById('separator');
    const addBtn = document.getElementById('addBtn');
    const toastMessage = document.getElementById('toastMessage');

    // 파스텔 팔레트 및 과목별 색상 매핑
    const pastelPalette = [
        '#E8F0FE', // Soft Blue
        '#E6F4EA', // Soft Green
        '#FEF7E0', // Soft Yellow
        '#FCE8E6', // Soft Pink
        '#F3E8FD', // Soft Purple
        '#E0F2F1', // Soft Teal
        '#FFF2E2', // Soft Peach
        '#EAEFF5'  // Soft Slate
    ];
    const courseColorMap = {};

    function getCourseColor(courseName) {
        if (!courseColorMap[courseName]) {
            const index = Object.keys(courseColorMap).length % pastelPalette.length;
            courseColorMap[courseName] = pastelPalette[index];
        }
        return courseColorMap[courseName];
    }

    // 0. 플레이스홀더 동적 업데이트 로직
    function updatePlaceholder() {
        const separator = separatorSelect.value;
        const currentOrder = [...sortableList.querySelectorAll('.sortable-item')].map(item => item.dataset.type);
        
        const exampleData = {
            name: '생활속의 예술',
            place: 'E0107',
            time: '월 09:00-11:00'
        };
        
        const joinString = separator === ' ' ? ' ' : `${separator} `;
        const placeholderString = currentOrder.map(type => exampleData[type]).join(joinString);
        
        rawInput.placeholder = `강의 정보 붙여넣기 (예: ${placeholderString})`;
    }

    updatePlaceholder();
    separatorSelect.addEventListener('change', updatePlaceholder);

    // 1. 기본 테이블 생성 로직 (09:00 ~ 17:00)
    for (let time = 9; time <= 17; time++) {
        const tr = document.createElement('tr');
        const thTime = document.createElement('td');
        thTime.textContent = `${String(time).padStart(2, '0')}:00`;
        tr.appendChild(thTime);

        for (let day = 1; day <= 5; day++) {
            const td = document.createElement('td');
            td.dataset.day = day;
            td.dataset.time = time;
            
            td.addEventListener('click', function() {
                if (this.classList.contains('filled')) {
                    this.innerHTML = '';
                    this.style.backgroundColor = '';
                    this.classList.remove('filled');
                }
            });
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    // 2. 드래그 앤 드롭 로직
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
            updatePlaceholder();
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

    // 3. 스마트 파서 및 데이터 매핑 로직
    function showToast(message) {
        toastMessage.textContent = message;
        toastMessage.classList.add('show');
        setTimeout(() => toastMessage.classList.remove('show'), 2500);
    }

    function parseTimeData(timeStr) {
        const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
        const dayMatch = timeStr.match(/[월화수목금]/);
        if (!dayMatch) return null;
        
        const dayIndex = dayMap[dayMatch[0]];
        let periods = [];

        if (timeStr.includes(':')) {
            const hours = [...timeStr.matchAll(/(\d{1,2}):/g)].map(m => parseInt(m[1]));
            if (hours.length >= 2) {
                let start = hours[0];
                let end = hours[hours.length - 1];
                if (start < 9) start += 12;
                if (end < 9) end += 12;

                for (let i = start; i < end; i++) periods.push(i);
            }
        } else if (timeStr.includes('-') || timeStr.includes('~')) {
            const nums = timeStr.match(/\d+/g).map(Number);
            if (nums.length >= 2) {
                for (let i = nums[0]; i <= nums[1]; i++) periods.push(i + 8);
            }
        } else {
            const nums = timeStr.match(/\d+/g);
            if (nums) periods = nums.map(n => Number(n) + 8);
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
        
        const currentOrder = [...sortableList.querySelectorAll('.sortable-item')].map(item => item.dataset.type);
        
        let courseData = { name: '', place: '', timeStr: '' };
        
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
            showToast('시간을 인식할 수 없습니다. (예: 월 09:00~11:00)');
            return;
        }

        // 해당 과목 전용 파스텔 컬러 추출
        const bgAccent = getCourseColor(courseData.name);

        parsedTime.periods.forEach(period => {
            const targetCell = document.querySelector(`td[data-day="${parsedTime.dayIndex}"][data-time="${period}"]`);
            if (targetCell) {
                targetCell.innerHTML = `${courseData.name}<span class="course-place">${courseData.place}</span>`;
                targetCell.style.backgroundColor = bgAccent;
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