describe('template spec', () => {
  it('passes', () => {
    cy.visit('/');
    cy.get('h1').should('have.text', 'Hello World!!');
  });
});
