function calculateAge(birthDate) {
    const now = new Date();
    const birth = new Date(birthDate);
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    let fullDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    let fullMonths = years * 12 + months - 1;
    let minutes = Math.floor((now - birth) / (1000 * 60));
    let seconds = Math.floor((now - birth) / 1000);

    if (days < 0) {
        months--;
        const previousMonth = (now.getMonth() - 1 + 12) % 12;
        const daysInPreviousMonth = new Date(now.getFullYear(), previousMonth + 1, 0).getDate();
        days += daysInPreviousMonth;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days, fullDays, fullMonths, minutes, seconds };
}

let format = {
    fresno: 'months-days',
    anaheim: 'months-days'
};

function numberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function plural(unit, num) {
    let plural = num == 1 ? unit : unit + "s"
    return numberWithCommas(num) + " " + plural
}

function updateDisplay(cat, age) {
    const yearsEl = document.getElementById(`${cat}-years`);
    const monthsEl = document.getElementById(`${cat}-months`);
    const daysEl = document.getElementById(`${cat}-days`);
    const buttonEl = document.getElementById(`toggle-${cat}`);

    if (format[cat] === 'days') {
        yearsEl.textContent = '';
        monthsEl.textContent = '';
        daysEl.textContent = plural("day", age.fullDays);
        buttonEl.textContent = 'months and days';
    } else if (format[cat] === 'months-days') {
        yearsEl.textContent = '';
        monthsEl.textContent = plural("month", age.fullMonths);
        daysEl.textContent = plural("day", age.days);
        buttonEl.textContent = 'years and months';
    } else if (format[cat] === 'years-months') {
        yearsEl.textContent = plural("year", age.years);
        monthsEl.textContent = plural("month", age.months);
        daysEl.textContent = plural("day", age.days);
        buttonEl.textContent = 'minutes';
    } else if (format[cat] === 'minutes') {
        yearsEl.textContent = '';
        monthsEl.textContent = '';
        daysEl.textContent = plural("minute", age.minutes);
        buttonEl.textContent = 'seconds';
    } else if (format[cat] === 'seconds') {
        yearsEl.textContent = '';
        monthsEl.textContent = '';
        daysEl.textContent = plural("second", age.seconds);;
        buttonEl.textContent = 'days';
    }
}

function initialLoad() {
    const fresnoAge = calculateAge('2024-03-29');
    const anaheimAge = calculateAge('2024-05-28');

    updateDisplay('fresno', fresnoAge);
    updateDisplay('anaheim', anaheimAge);
}

function toggleFormat(cat, birthDate) {
    const age = calculateAge(birthDate);

    if (format[cat] === 'days') {
        format[cat] = 'months-days';
    } else if (format[cat] === 'months-days') {
        format[cat] = 'years-months';
    } else if (format[cat] === 'years-months') {
        format[cat] = 'minutes';
    } else if (format[cat] === 'minutes') {
        format[cat] = 'seconds';
    } else if (format[cat] === 'seconds') {
        format[cat] = 'days';
    }

    updateDisplay(cat, age);
}

setInterval(() => {
    const fresnoAge = calculateAge('2024-03-29');
    const anaheimAge = calculateAge('2024-05-28');
    
    updateDisplay('fresno', fresnoAge);
    updateDisplay('anaheim', anaheimAge);
}, 1000);

document.getElementById('toggle-fresno').addEventListener('click', () => toggleFormat('fresno', '2024-03-29'));
document.getElementById('toggle-anaheim').addEventListener('click', () => toggleFormat('anaheim', '2024-05-28'));

document.getElementById('toggle-fresno').textContent = 'months and days';
document.getElementById('toggle-anaheim').textContent = 'months and days';

initialLoad();