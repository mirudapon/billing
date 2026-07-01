import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SplitEditor from './SplitEditor'
import { Member, Split } from '../types'

const members: Member[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
]

const defaultSplits: Split[] = [
  { memberId: 'alice', ratio: 1 },
  { memberId: 'bob', ratio: 1 },
]

describe('SplitEditor', () => {
  it('renders a row for each member', () => {
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows calculated share amount for each member', () => {
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={vi.fn()}
      />
    )
    const amounts = screen.getAllByText('100.00')
    expect(amounts).toHaveLength(2)
  })

  it('shows correct amounts for unequal ratios', () => {
    render(
      <SplitEditor
        members={members}
        splits={[
          { memberId: 'alice', ratio: 1 },
          { memberId: 'bob', ratio: 2 },
        ]}
        totalBaseAmount={300}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('100.00')).toBeInTheDocument()
    expect(screen.getByText('200.00')).toBeInTheDocument()
  })

  it('calls onChange when a ratio input changes', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')?.ratio).toBe(3)
  })

  it('calls onChange with member removed when checkbox unchecked', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={onChange}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')).toBeUndefined()
  })

  it('calls onChange with member added when checkbox checked', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={[{ memberId: 'bob', ratio: 1 }]}
        totalBaseAmount={100}
        onChange={onChange}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')).toBeDefined()
  })
})
