export class ExerciseList {
  constructor(listEl, exercises) {
    this.listEl = listEl;
    this.exercises = exercises;
  }

  render() {
    this.listEl.innerHTML = this.exercises.map((text, index) => `
      <li class="exercise-item" id="item-${index}">
        <span>${index + 1}. ${text}</span>
        ${index === 0 ? '<span class="badge">Next</span>' : ''}
      </li>
    `).join('');

    this.setActive(0);
  }

  setActive(currentSet) {
    this.listEl.querySelectorAll('.exercise-item').forEach((el) => {
      el.classList.remove('is-active');
      el.querySelector('.badge')?.remove();
    });

    const currentEl = this.listEl.querySelector(`#item-${currentSet}`);
    if (!currentEl) return;

    currentEl.classList.add('is-active');
    currentEl.insertAdjacentHTML('beforeend', '<span class="badge">Now</span>');
    currentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}