import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Activate from '@/pages/Activate'
import accountsService from '@/services/accounts'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

vi.mock('@/services/accounts', () => ({
  default: {
    activate: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Activate page', () => {
  it('submits activation and navigates on success', async () => {
    ;(accountsService.activate as unknown as vi.Mock).mockResolvedValue({})

    render(
      <MemoryRouter>
        <Activate />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/Activation Code/i), { target: { value: 'CODE123' } })

    fireEvent.click(screen.getByRole('button', { name: /Activate/i }))

    await waitFor(() => expect(accountsService.activate).toHaveBeenCalledWith('testuser', 'CODE123'))
  })
})
