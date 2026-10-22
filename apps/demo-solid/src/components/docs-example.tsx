// Renders the docs home page example; its screenshots live in docs/public/screens.
export default function DocsExample() {
  return (
    <>
      <actionbar title="MasonKit" />
      <scroll style={{ backgroundColor: '#f4f6fb', padding: 16 }}>
        <div class="card">
          <h2>Hello Mason</h2>
          <p>
            Styled with <strong>real</strong> CSS: flexbox, gradients and rem units.
          </p>
          <div class="tags">
            <span>flex</span>
            <span>grid</span>
            <span>float</span>
          </div>
        </div>
      </scroll>
    </>
  )
}
