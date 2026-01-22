import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createGlobalStyle } from 'styled-components'
import { BrowserRouter } from 'react-router-dom'

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f0f2f5;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
  }
  * {
    box-sizing: border-box;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 600;
  }

  button, input, select, textarea {
    font-family: inherit;
  }
`

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalStyle />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)