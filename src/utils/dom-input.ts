/**
 * Creates an HTML input element positioned over the Phaser canvas.
 * Returns the input element. Caller is responsible for removing it.
 */
export function createDOMInput(
  gameX: number,
  gameY: number,
  gameWidth: number,
  opts: {
    placeholder?: string;
    maxLength?: number;
    uppercase?: boolean;
    fontSize?: string;
  } = {}
): HTMLInputElement {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('No canvas found');

  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / 800;
  const scaleY = rect.height / 600;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = opts.placeholder || '';
  if (opts.maxLength) input.maxLength = opts.maxLength;

  input.style.position = 'absolute';
  input.style.left = `${rect.left + gameX * scaleX}px`;
  input.style.top = `${rect.top + gameY * scaleY}px`;
  input.style.width = `${gameWidth * scaleX}px`;
  input.style.height = `${40 * scaleY}px`;
  input.style.fontSize = opts.fontSize || `${16 * scaleX}px`;
  input.style.fontFamily = 'Georgia, serif';
  input.style.padding = `${8 * scaleX}px`;
  input.style.border = '2px solid #D0D0D0';
  input.style.borderRadius = '4px';
  input.style.outline = 'none';
  input.style.background = '#FAFAFA';
  input.style.color = '#1A1A1A';
  input.style.boxSizing = 'border-box';
  input.style.zIndex = '1000';

  if (opts.uppercase) {
    input.style.textTransform = 'uppercase';
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase();
    });
  }

  input.addEventListener('focus', () => {
    input.style.borderColor = '#4992FF';
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = '#D0D0D0';
  });

  document.body.appendChild(input);
  input.focus();
  return input;
}

export function removeDOMInput(input: HTMLInputElement | null) {
  if (input && input.parentNode) {
    input.parentNode.removeChild(input);
  }
}
