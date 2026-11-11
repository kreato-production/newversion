import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TagInput } from './TagInput';

function Harness({
  initial = [],
  suggestions = [],
}: {
  initial?: string[];
  suggestions?: string[];
}) {
  const [tags, setTags] = useState<string[]>(initial);
  return (
    <>
      <TagInput id="tags" value={tags} onChange={setTags} suggestions={suggestions} maxTags={3} />
      <output data-testid="value">{JSON.stringify(tags)}</output>
    </>
  );
}

const value = () => JSON.parse(screen.getByTestId('value').textContent ?? '[]');
function type(text: string) {
  const field = document.getElementById('tags') as HTMLInputElement;
  fireEvent.change(field, { target: { value: text } });
  return field;
}

describe('TagInput', () => {
  it('adiciona com Enter e separa por vírgula, ignorando duplicadas', () => {
    render(<Harness />);
    fireEvent.keyDown(type('ator, Bilíngue ,ATOR'), { key: 'Enter' });
    expect(value()).toEqual(['ator', 'Bilíngue']);
  });

  it('reaproveita a grafia de uma tag existente', () => {
    render(<Harness suggestions={['Apresentador']} />);
    fireEvent.keyDown(type('apresentador'), { key: 'Enter' });
    expect(value()).toEqual(['Apresentador']);
  });

  it('remove a última tag com Backspace no campo vazio', () => {
    render(<Harness initial={['a', 'b']} />);
    fireEvent.keyDown(document.getElementById('tags')!, { key: 'Backspace' });
    expect(value()).toEqual(['a']);
  });

  it('remove uma tag pelo botão', () => {
    render(<Harness initial={['a', 'b']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remover tag a' }));
    expect(value()).toEqual(['b']);
  });

  it('respeita o limite de tags', () => {
    render(<Harness initial={['a', 'b']} />);
    fireEvent.keyDown(type('c, d'), { key: 'Enter' });
    expect(value()).toEqual(['a', 'b', 'c']);
    expect(document.getElementById('tags')).toBeDisabled();
  });
});
