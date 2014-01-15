$(function() {
	var List = Backbone.Model.extend({
		defaults: function() {
			return {
				title: '',
				items: []
			}
		},

		addItem: function(itemId) {
			var itemArray = this.get('items');
			itemArray.push(itemId);
			this.save();
			
		},

		removeItem: function(itemId) {
			var itemArray = this.get('items');
			for (i=0; i<itemArray.length; i++) {
				if (itemArray[i] == itemId) {
					itemArray.splice(i, 1);
				}
			}
		},

		getItems: function() {
			return this.get('items');
		}

	});

	var ListCollection = Backbone.Collection.extend({
		model: List,

		localStorage : new Backbone.LocalStorage('Lists')
	});

	var Lists = new ListCollection();

	var ListView = Backbone.View.extend({
		tagName: 'div',

		template: _.template($('#list-template').html()),

		events: {
			'dblclick .list-title' : 'edit',
			'dblclick .list-destroy' : 'clear',
			'keypress .list-edit' : 'updateOnEnter'
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
	        this.$el.html(this.template(this.model.toJSON()));
	        this.input = this.$('.list-edit');
	        return this;
	    },
		
		edit: function() {
			this.$el.addClass('editing-list');
			this.input.focus();
		},

		close: function() {
			var value = this.input.val();
			if (!value) { 
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass('editing-list');
			}
		},

		updateOnEnter: function(e) {
			if (e.keyCode == 13) this.close();
		},

		clear: function() {
			this.model.destroy();
		}


	});

	var Item = Backbone.Model.extend({
		defaults: function() {
			return {
				title: '',
				done: false,
				list: 0
			}
		},

		toggleDone: function() {
			this.save('done', !this.get('done'));
			return this.get('done');
		},

		moveToList: function(listId) {
			this.set('list', listId);
		}
	});

	var ItemCollection = Backbone.Collection.extend({
		model: Item,

		localStorage: new Backbone.LocalStorage('Items')
	});

	var Items = new ItemCollection();

	var ItemView =  Backbone.View.extend({
		tagName: 'li',

		template: _.template($('#item-template').html()),

		events: {
			'click .todo-view'    : 'toggleDone',
			'dblclick .todo-view' : 'edit',
			'click .todo-destroy' : 'clear',
			'keypress .todo-edit' : 'updateOnEnter',
		},

		initialize: function() {
			this.trigger()
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);


			if (this.model.get('done')) {
				this.$el.addClass('done');
			}
		},

		render: function() {
	        this.$el.html(this.template(this.model.toJSON()));
	        this.input = this.$('.todo-edit');


			/*if (Items.length > 0) {
				var top = Items.at(0);
				this.$('#priority').innerHTML = top.get('title');
			} else {
				console.log('zero items');
				console.log(this.$('#tagline').innerHTML);
			}*/

	        return this;
	    },

	    toggleDone: function() {
	    	var done = this.model.toggleDone();
	    	if (done) {
	    		this.$el.addClass('done');
	    	} else {
	    		this.$el.removeClass('done');
	    	}

	    },

		edit: function() {
			this.$el.addClass('editing-todo');
			this.input.focus();
		},

		close: function() {
			var value = this.input.val();
			if (!value) { 
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass('editing-todo');
			}
		},

		updateOnEnter: function(e) {
			if (e.keyCode == 13) this.close();
		},

		clear: function() {

			var listNumber = this.model.get('list');
	    	var currList = Lists.at(listNumber);
	    	currList.removeItem(this.model.cid);

	    	console.log('clearing item');
			this.model.destroy();
		}
	});

	var AppView = Backbone.View.extend({
		el: $('#todoapp'),

		events: {
			'keypress #new-todo' : 'createItem',
			'keypress #new-list' : 'createList'
		},

		initialize: function() {
			this.itemInput = this.$('#new-todo');
			this.listInput = this.$('#new-list');

			this.listenTo(Items, 'add', this.addOneItem);
			this.listenTo(Lists, 'add', this.addOneList);

			Lists.fetch();


			if (Lists.length === 0) {
				Lists.create({title: 'TODAY'});
				Lists.create({title: 'TOMORROW'});
				Lists.create({title: 'EVENTUALLY'});
			}

			console.log($('#lists')[0].firstChild);
			console.log($($('#lists')[0].firstChild)[0].firstChild.nextSibling);

			var todayList = $('#lists')[0].firstChild;
			var firstSortableListView = $(todayList)[0].firstChild.nextSibling;
			$(firstSortableListView).attr('id', 'today');


			/*$(firstListView).attr('id', 'today');
			$(firstListView).attr('id', 'sortable');*/


			Items.fetch();

			$('.list-view > li').draggable({
				connectToSortable: '.list-view',
				revert: 'invalid'
			});

			$('.list-view').sortable({
				items: '> li',
				connectWith: '.list-view',
				placeholder: 'placeholder',
				stop: function(event, ui) {
					ui.item.trigger('drop', ui.item.index());
				}
			});

			$('.list-view').droppable();

			$('.todo-edit').focusout(function() {
				
			})

		},

		addOneItem: function(item) {
			var view = new ItemView({model: item});
			this.$('#today').append(view.render().el);
		},

		addOneList: function(list) {
			var view = new ListView({model: list});
			this.$('#lists').append(view.render().el);
		},

		createItem: function(e) {
			if (e.keyCode != 13) return;
			if (!this.itemInput.val()) return;

			var currItem = Items.create({title: this.itemInput.val()});
			currItem.moveToList(0);
			var currList = Lists.at(0);
			currList.addItem(currItem.cid);
			this.itemInput.val('');
		},

		createList: function(e) {
			if (e.keyCode != 13) return;
			if (!this.listInput.val()) return;
			var capTitle = this.listInput.val().toUpperCase();
			Lists.create({title: capTitle});
			this.listInput.val('');
		}

	});

	var App = new AppView;

	});