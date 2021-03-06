import template from './withredux.html';
import './withredux.scss';

import TodoActions from '../../actions/todo.actions';
import TypeActions from '../../actions/type.actions';

import TodoSelectors from '../../selectors/todos.selectors';
import TypesSelectors from '../../selectors/types.selectors';

export const WithReduxComponent = {
  template,
  transclude: true,
  controller: class WithReduxController {
    /**
     * Constructor for the WithReduxComponent
     * @param {*} $ngRedux
     * @param {*} $stateParams
     */
    constructor($ngRedux, $stateParams) {
      'ngInject';
      let $ctrl = this;

      $ctrl.$onDestroy = onDestroy;

      $ctrl.submitTodo = submitTodo;
      $ctrl.submitTodoInXSeconds = submitTodoInXSeconds;
      $ctrl.submitChangeTodoType = submitChangeTodoType;

      $ctrl.buttonClick = buttonClick;
      $ctrl.getTypeById = getTypeById;
      $ctrl.clearSelectorsCache = clearSelectorsCache;

      $ctrl.inputTodo = '';
      $ctrl.selectedTypeId = $stateParams.typeid;

      $ctrl.unsubscribe = $ngRedux.connect(
        mapStateToThis($stateParams.typeid), {...TodoActions, ...TypeActions}
      )($ctrl);

      /**
       * onDestroy method
       */
      function onDestroy() {
        $ctrl.unsubscribe();
      }

      /**
       * mapStateToThis - Maps the state to the controller
       * @param {*} typeId
       * @return {*} Selectors from the state and other needed variables
       */
      function mapStateToThis(typeId) {
        return function(state) {
          return _.merge({
            // TODO: Remove the below line and all it's references. It's just to show the current full state
            completeState: state,

            // Directly from the state
            isLoading: state.TodosState.isLoading,
            showType: state.TodosState.showType,
            showDone: state.TodosState.showDone,
            notification: state.TodosState.notification,

            // Get from the types selector
            allTypes: TypesSelectors.getAllTypes(state),
          },
            /**
             * Standard selectors
             */
           _.reduce(_.map(TodoSelectors.nonParametric, function(fn, key) {
              return {[key]: fn(state)};
            }), _.merge, {}),
            /**
             * Parametric selectors
             */
            // TODO: Create function in selectorUtils
            _.reduce(_.map(TodoSelectors.parametric.type, function(fn, key) {
              return {[key]: fn(typeId)(state)};
            }), _.merge, {})
          );
        };
      };

      /**
       * Calls the action addTodo send the input parameter and clearing the input todo
       */
      function submitTodo() {
        // Exits if it's neither a mouse click, a enter key press or the inputTodo is empty
        if ((event.type !== 'click' && event.keyCode !== 13) || !$ctrl.inputTodo) return;

        $ctrl.addTodo($ctrl.inputTodo, $ctrl.selectedType.id);
        $ctrl.inputTodo = '';
        $ctrl.selectedType = -1;
      }

      /**
       * Calls the addTodo action but with a delay of x seconds
       * @param {*} seconds
       */
      function submitTodoInXSeconds(seconds) {
        $ctrl.addTodoThunk(seconds, $ctrl.inputTodo, $ctrl.selectedType.id);
        $ctrl.inputTodo = '';
        $ctrl.selectedType = -1;
      }

      /**
       * Calls the addTodo action but with a delay of x seconds
       * @param {Number} todoId
       * @param {Number} typeId
       */
      function submitChangeTodoType(todoId, typeId) {
        $ctrl.changeTodoType(todoId, typeId);
      }

      /**
       * Triggered when the action button is cliced on the component todoList
       * @param {*} id
       * @param {*} actionType
       * @param {*} event
       */
      function buttonClick(id, actionType, event) {
        switch (actionType) {
          case 'CleanError':
            $ctrl.cleanError(id);
            break;
          case 'ToggleDone':
            $ctrl.toggleDone(id);
            break;
          default:
            console.log('Invalid action type');
            break;
        }
      }
      /**
       * Returns the name of the type using the received Id
       * @param {Number} typeId
       * @return {String} Name of the type
       */
      function getTypeById(typeId) {
        let types = $ctrl.allTypes.filter((type) => type.id === parseInt(typeId));
        return types.length > 0 ? types[0].text : 'All types';
      }
      /**
       * Clears the cache on all the parametric selectors
       */
      function clearSelectorsCache() {
        TodoSelectors.parametric.type.$cache.delete(0);
        _.each($ctrl.allTypes, (type) => TodoSelectors.parametric.type.$cache.delete(type.id));
      }
    }
  },
};
