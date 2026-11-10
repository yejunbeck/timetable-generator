document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#timetable tbody');
    const addBtn = document.getElementById('addBtn');
    const courseNameInput = document.getElementById('courseName');
    const coursePlaceInput = document.getElementById('coursePlace');
    const courseDaySelect = document.getElementById('courseDay');
    const courseTimeSelect = document.getElementById('courseTime');
    const toastMessage = document.getElementById('toastMessage');

    // 1~9교시 빈 테이블 행 생성
    for (let i = 1; i <= 9; i++) {
        const tr = document.createElement('tr');
        const thTime = document.createElement('td');
        thTime.textContent = `${i}교시`;
        tr.appendChild(thTime);

        for (let j = 1; j <= 5; j++) {
            const td = document.createElement('td');
            td.dataset.day = j;
            td.dataset.time = i;
            
            // 등록된 강의 클릭 시 삭제하는 이벤트
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

    // 토스트 알림창 띄우기 함수
    function showToast(message) {
        toastMessage.textContent = message;
        toastMessage.classList.add('show');
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, 2500);
    }

    // 시간표에 강의 추가 로직
    function addCourse() {
        const name = courseNameInput.value.trim();
        const place = coursePlaceInput.value.trim();
        const day = courseDaySelect.value;
        const time = courseTimeSelect.value;

        if (!name || !place) {
            showToast('강의명과 장소를 모두 입력해 주세요.');
            return;
        }

        const targetCell = document.querySelector(`td[data-day="${day}"][data-time="${time}"]`);
        
        if (targetCell) {
            targetCell.innerHTML = `
                ${name}
                <span class="course-place">${place}</span>
            `;
            targetCell.classList.add('filled');
            
            // 입력창 초기화 및 포커스 이동
            courseNameInput.value = '';
            coursePlaceInput.value = '';
            courseNameInput.focus();
        }
    }

    // 버튼 클릭 이벤트
    addBtn.addEventListener('click', addCourse);

    // 인풋창에서 엔터키 입력 시 추가 이벤트
    [courseNameInput, coursePlaceInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCourse();
            }
        });
    });
});