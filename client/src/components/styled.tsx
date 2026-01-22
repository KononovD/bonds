import styled from 'styled-components';
import { NavLink as RouterNavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Colors & Theme ---
const colors = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  background: '#ffffff',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

// --- Layout ---
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

// --- Header ---
export const Header = styled(motion.header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  padding: 20px 30px;
  margin-bottom: 40px;
  border-radius: 16px;
  box-shadow: ${colors.shadow};
  position: sticky;
  top: 20px;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

export const Nav = styled.nav`
  display: flex;
  gap: 30px;
`;

export const NavLink = styled(RouterNavLink)`
  text-decoration: none;
  color: ${colors.textSecondary};
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: ${colors.primary};
  }
  
  &.active {
    color: ${colors.primary};
  }
`;

// --- Cards & Content ---
export const Card = styled(motion.div)`
  background: ${colors.surface};
  padding: 30px;
  border-radius: 20px;
  box-shadow: ${colors.shadow};
  margin-bottom: 30px;
  border: 1px solid ${colors.border};
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: ${colors.shadowHover};
  }
`;

export const Title = styled.h2`
  margin-bottom: 20px;
  color: ${colors.text};
  font-size: 1.5rem;
  letter-spacing: -0.025em;
`;

// --- Tables ---
export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 10px;
`;

export const Th = styled.th`
  text-align: left;
  padding: 16px;
  border-bottom: 2px solid ${colors.border};
  color: ${colors.textSecondary};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`;

export const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${colors.border};
  color: ${colors.text};
  font-size: 0.95rem;
  transition: background 0.2s;

  tr:last-child & {
    border-bottom: none;
  }
`;

// --- Buttons ---
export const Button = styled(motion.button)<{ $variant?: 'danger' | 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${props => props.$variant === 'danger' ? colors.danger : props.$variant === 'primary' ? colors.primary : '#f3f4f6'};
  color: ${props => props.$variant === 'secondary' || !props.$variant ? colors.text : 'white'};
  font-weight: 600;
  font-size: 0.9rem;
  margin-right: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${props => props.$variant === 'danger' ? colors.dangerHover : props.$variant === 'primary' ? colors.primaryHover : '#e5e7eb'};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

// --- Forms ---
export const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid ${colors.border};
  border-radius: 12px;
  width: 100%;
  margin-bottom: 15px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    background: white;
  }
`;

export const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid ${colors.border};
  border-radius: 12px;
  width: 100%;
  margin-bottom: 15px;
  font-size: 1rem;
  background: #f9fafb;
  appearance: none; 
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    background-color: white;
  }
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${colors.textSecondary};
  font-size: 0.9rem;
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

// --- Animations ---
export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);