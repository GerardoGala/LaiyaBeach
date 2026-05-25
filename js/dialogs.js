// dialogs.js
document.querySelectorAll('.open-dialog').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    document.getElementById(target).classList.add('active');
  });
});

document.querySelectorAll('.close-dialog').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    document.getElementById(target).classList.remove('active');
  });
});
