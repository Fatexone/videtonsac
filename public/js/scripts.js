document.querySelector('form').addEventListener('submit', function() {
    const bag = document.getElementById('punching-bag');
    bag.classList.add('hit');
  
    setTimeout(() => {
      bag.classList.remove('hit');
    }, 100);
  });
  