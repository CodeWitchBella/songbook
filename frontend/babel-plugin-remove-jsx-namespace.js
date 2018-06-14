/* eslint-disable import/no-commonjs */

/* removes export namespace JSX {} */
module.exports = ({ types: t }) => ({
  visitor: {
    ExportNamedDeclaration(path, state) {
      if (
        path.node.declaration &&
        path.node.declaration.type === 'TSModuleDeclaration' &&
        path.node.declaration.id.name === 'JSX'
      ) {
        path.replaceWithSourceString('(()=>{})()')
      }
    },
  },
})
