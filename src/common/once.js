/**
 * A standalone implementation of the Drupal `once` function.
 *
 * This function ensures that a given operation is only performed once on a
 * given element. It uses a WeakMap to keep track of which elements have been
 * processed.
 *
 * @param {string} id A unique identifier for the operation.
 * @param {string} selector The CSS selector for the elements to process.
 * @param {Element} [context=document] The context in which to search for elements.
 * @returns {Element[]} An array of elements that have not been processed yet.
 */
export default function once(id, selector, context = document) {
  // Use a static variable to store the WeakMap.
  if (!once.processed) {
    once.processed = new WeakMap();
  }

  const newElements = [];

  const elements = context.querySelectorAll(selector);
  elements.forEach((element) => {
    if (!once.processed.has(element)) {
      once.processed.set(element, new Set());
    }

    const processedIds = once.processed.get(element);
    if (!processedIds.has(id)) {
      processedIds.add(id);
      newElements.push(element);
    }
  });

  return newElements;
}
