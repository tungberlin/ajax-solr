// $Id$

/**
 * Baseclass for all facet widgets.
 *
 * @class AbstractFacetWidget
 * @augments AjaxSolr.AbstractWidget
 */
AjaxSolr.AbstractFacetWidget = AjaxSolr.AbstractWidget.extend(
  /** @lends AjaxSolr.AbstractFacetWidget.prototype */
  {
  /**
   * The field to facet on.
   *
   * @field
   * @public
   * @type String
   */
  fieldName: null,

  /**
   * Maximum number of facet values to display.
   *
   * @field
   * @public
   * @type Number
   */
  limit: null,

  /**
   * Facet operator.
   *
   * @field
   * @public
   * @type String
   * @default "AND"
   */
  operator: 'AND',

  /**
   * Whether the facet values are publicly viewable.
   *
   * @field
   * @public
   * @type Boolean
   * @default false
   */
  hidden: false,

  /**
   * A flag that indicates whether new selected items should replace old ones.
   *
   * @field
   * @private
   * @type Boolean
   * @default false
   */
  replace: false,

  /**
   * The list of selected items (filters).
   *
   * @field
   * @private
   * @type Array
   * @default []
   */
  selectedItems: [],

  /**
   * Facet fields returned by Solr.
   *
   * @field
   * @private
   */
  facetFields: null,

  /**
   * Facet dates returned by Solr.
   *
   * @field
   * @private
   */
  facetDates: null,

  /**
   * Add the given items to the list of selected items.
   *
   * @param {Array} items The items to add.
   * @returns {Boolean} Whether the selection changed.
   */
  selectItems: function (items) {
    if (this.replace) {
      this.clear();
    }

    return this.changeSelection(function () {
      for (var i = 0; i < items.length; i++) {
        if (!AjaxSolr.contains(this.selectedItems, items[i])) {
          this.selectedItems.push(items[i]);
        }
      }
    });
  },

  /**
   * Removes the given items from the list of selected items.
   *
   * @param {Array} items The items to remove.
   * @returns {Boolean} Whether the selection changed.
   */
  deselectItems: function (items) {
    return this.changeSelection(function () {
      for (var i = 0; i < items.length; i++) {
        for (var j = this.selectedItems.length - 1; j >= 0; j--) {
          if (this.selectedItems[j] == items[i]) {
            this.selectedItems.splice(j, 1);
          }
        }
      }
    });
  },

  /**
   * Removes all items from the current selection.
   *
   * @returns {Boolean} Whether the selection changed.
   */
  clear: function () {
    return this.changeSelection(function () {
      this.selectedItems = [];
    });
  },

  /**
   * Helper for selection functions.
   *
   * @param {Function} Selection function to call.
   * @returns {Boolean} Whether the selection changed.
   */
  changeSelection: function (func) {
    var start = this.selectedItems.length;
    func.apply(this);
    if (this.selectedItems.length < start) {
      this.afterChangeSelection();
    }
    return this.selectedItems.length < start;
  },

  /**
   * An abstract hook for child implementations.
   * This method is executed after items are selected or deselected.
   */
  afterChangeSelection: function () {},

  alterQuery: function (queryObj) {
    queryObj.fields.push(this.fieldName);
    queryObj.fq = queryObj.fq.concat(this.getItems());
  },

  handleResult: function (data) {
    if (data.facet_counts) {
      this.facetFields = data.facet_counts.facet_fields[this.fieldName];
      this.facetDates = data.facet_counts.facet_dates[this.fieldName];
      // Allow the child implementation to handle the result.
      this._handleResult();
    }
  },

  /**
   * An abstract hook for child implementations.
   * Allow the child to handle the result without parsing the response.
   */
  _handleResult: function () {},

  /**
   * Returns all the selected items as filter query items.
   *
   * @returns {FilterQueryItem[]}
   */
  getItems: function () {
    var items = [];
    for (var i = 0; i < this.selectedItems.length; i++) {
      items.push(new AjaxSolr.FilterQueryItem({
        field: this.fieldName,
        value: this.selectedItems[i],
        hidden: this.hidden,
        widgetId: this.id
      }));
    }
    return items;
  },

  /**
   * Returns a function to deselect the given value.
   *
   * @param value The given value.
   * @returns {Function}
   */
  unclickHandler: function (value) {
    var me = this;
    return function () {
      if (me.deselectItems([ value ])) {
        me.manager.doRequest(0);
      }
      return false;
    }
  },

  /**
   * Returns a function to select the given value.
   *
   * @param value The given value.
   * @returns {Function}
   */
  clickHandler: function (value) {
    var me = this;
    return function () {
      if (me.selectItems([ value ])) {
        me.manager.doRequest(0);
      }
      return false;
    }
  },

  /**
   * Returns a string representation of the value to deselect.
   *
   * @param value The value to deselect.
   * @returns {String}
   */
  unclickText: function (value) {
    return value;
  },

  /**
   * Returns a string representation of the value to select.
   *
   * @param value The value to select.
   * @returns {String}
   */
  clickText: function (value) {
    return value;
  }
});