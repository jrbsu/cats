function calculateAge(birthDate) {
    const now = new Date();
    const birth = new Date(birthDate);
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    let fullDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    let fullMonths = years * 12 + months - 1;
    let minutes = Math.floor((now - birth) / (1000 * 60));

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

    return { years, months, days, fullDays, fullMonths, minutes };
}

// Store the format for each cat
let format = {
    fresno: 'months-days',
    anaheim: 'months-days'
};

function toggleFormat(cat, age) {
    const yearsEl = document.getElementById(`${cat}-years`);
    const monthsEl = document.getElementById(`${cat}-months`);
    const daysEl = document.getElementById(`${cat}-days`);
    const buttonEl = document.getElementById(`toggle-${cat}`);

    if (format[cat] === 'days') {
        yearsEl.textContent = '';
        monthsEl.textContent = '';
        daysEl.textContent = age.fullDays + ' days';
        format[cat] = 'months-days';
        buttonEl.textContent = 'months and days';
    } else if (format[cat] === 'months-days') {
        yearsEl.textContent = '';
        monthsEl.textContent = age.fullMonths + ' months';
        daysEl.textContent = age.days + ' days';
        format[cat] = 'years-months';
        buttonEl.textContent = 'years and months';
    } else if (format[cat] === 'years-months') {
        yearsEl.textContent = age.years + ' years';
        monthsEl.textContent = age.months + ' months';
        daysEl.textContent = age.days + ' days';
        format[cat] = 'minutes';
        buttonEl.textContent = 'minutes';
    } else if (format[cat] === 'minutes') {
        yearsEl.textContent = '';
        monthsEl.textContent = '';
        daysEl.textContent = age.minutes + ' minutes';
        format[cat] = 'days';
        buttonEl.textContent = 'days';
    }
}

const fresnoBirthDate = '2024-03-29';
const fresnoAge = calculateAge(fresnoBirthDate);

const anaheimBirthDate = '2024-05-28';
const anaheimAge = calculateAge(anaheimBirthDate);

document.getElementById('fresno-years').textContent = '';
document.getElementById('fresno-months').textContent = '';
document.getElementById('fresno-days').textContent = fresnoAge.fullDays + ' days';

document.getElementById('anaheim-years').textContent = '';
document.getElementById('anaheim-months').textContent = '';
document.getElementById('anaheim-days').textContent = anaheimAge.fullDays + ' days';

document.getElementById('toggle-fresno').addEventListener('click', () => toggleFormat('fresno', fresnoAge));
document.getElementById('toggle-anaheim').addEventListener('click', () => toggleFormat('anaheim', anaheimAge));

document.getElementById('toggle-fresno').textContent = 'months and days';
document.getElementById('toggle-anaheim').textContent = 'months and days';
