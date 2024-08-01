class NodeUtils {

  constructor() {
    // Initialize to new empty array
    this.nodes = []
  }

  find(children, target) {
    // At the lowest level, children may be null or a simple string
    if (!Array.isArray(children)) return

    children.forEach((node) => {
      if (node.component !== null) {
        if (node.component.type?.name === target) {
          this.nodes.push(node.component.proxy)
          return
        }
      }

      if (Array.isArray(node?.children)) {
        this.find(node.children, target)
      }
    })

    return this.nodes
  }

  findNodes(target, { within }) {
    return this.find(within, target)
  }

}

export default NodeUtils
