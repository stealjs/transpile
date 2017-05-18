/**
 * Visitor function called on each node
 * @callback visitor
 * @param {{}} node The node being visited, it is augmented with the path (an
 *                  array of nodes, that leads to it)
 */

/**
 * Graph visitor based on the the https://en.wikipedia.org/wiki/Breadth-first_search
 *
 * @param {{}} startNode The node where the search/traverse starts
 * @param {Array} graph The graph to be traversed
 * @callback {visitor} fn A function called on each node
 */
module.exports = function bfs(startNode, graph, fn) {
	visit([{ node: startNode, path: [] }], graph, fn);
};

function visit(frontier, graph, fn) {
	var level = 0;
	var levels = {};

	while (0 < frontier.length) {
		var next = [];
		for (var i = 0; i < frontier.length; i++) {
			var cur = frontier[i];
			var node = cur.node;
			if (fn(cur) === false) {
				return;
			}
			levels[node] = level;
			for (var adj in graph[node]) {
				if (typeof levels[adj] === "undefined") {
					next.push({ node: adj, path: cur.path.concat(node) });
				}
			}
		}
		frontier = next; // eslint-disable-line no-param-reassign
		level += 1;
	}
}
