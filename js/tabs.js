// Pure tab switching
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    tabButtons.forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
  });
});
