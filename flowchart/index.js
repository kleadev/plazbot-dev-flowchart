const configurationsComponents = [
	{
		name: 'conversacion',
		mainColor: 'rgb(0, 184, 212)'
	},
	{
		name: 'contexto',
		mainColor: 'rgb(16, 183, 89)'
	},
	{
		name: 'slider',
		mainColor: 'rgb(220, 53, 69)'
	},
	{
		name: 'solicitud contacto',
		mainColor: 'rgb(33, 79, 126)'
	},
	{
		name: 'imagen',
		mainColor: 'rgb(255, 193, 7)'
	},
	{
		name: 'enlaces',
		mainColor: 'rgb(0, 184, 212)'
	},
	{
		name: 'capacitacion',
		mainColor: 'rgb(16, 183, 89)'
	},
	{
		name: 'traspaso',
		mainColor: 'rgb(220, 53, 69)'
	},
	{
		name: 'correo',
		mainColor: 'rgb(33, 79, 126)'
	},
	{
		name: 'asignacion agentes',
		mainColor: 'rgb(255, 193, 7)'
	},
	{
		name : 'webhook',
		mainColor: 'rgb(1, 184, 212)'
	}
]

const canvas = document.getElementById('canvas');
const wrapperCanvas = document.querySelector('.flowchart-canvas');
const btnZoomin = document.getElementById('btn-zoomin');
const btnZoomout = document.getElementById('btn-zoomout');

//constanst : not change in production
const CLASS_ITEM_DRAGGABLE = 'pz-draggable';
const FIRST_ELEMENT_ID_FLOWCHART = 'item-1';
const DATA_TYPE_LINEAL_FLOW = 'pz-lineal';
const DATA_TYPE_SIMPLE_CONDITIONAL = 'pz-simple-conditional';
const DATA_TYPE_PARALLEL_FLOW = 'pz-parallel';
const CLASS_EXTERNAL_INTERACTION_ITEM = 'pz-ext-item-fc';
// identifiers : not change in production
	// badges
const FLOWCHART_CONDITIONAL_YES = 1;
const FLOWCHART_CONDITIONAL_NO = 2;
	// types
const FLOWCHART_FIRST_ITEM = -5;
const FLOWCHART_LINEAL_FLOW = 1;
const FLOWCHART_SIMPLE_CONDITIONAL_FLOW = 2;
const FLOWCHART_PARALLEL_FLOW = 3;
// Percentage for control adjunt : will change in production -> only accepts bottom adjunt still
const FLOWCHART_SIMPLEC_PERCENTAGE_YES_CONTROL_ADJUNT = 25;
const FLOWCHART_SIMPLEC_PERCENTAGE_NO_CONTROL_ADJUNT = 75;
const FLOWCHART_SIMPLE_PERCENTAGE_ADJUNT = 50;
const FLOWCHART_PARALLEL_PERCENTAGE_ADJUNT = 50;

var ctx = canvas.getContext('2d');
var itemsFlowchart = [];
canvas.width = 1315;
canvas.height = 680;

var externalItemInteraction = false;
var triggerInteraction = false;
var movingCanvas = false;
var dragging = false;
var grabbing = false;
var attachable = false;
var currentItemSelected = null;
var currentExternalSelected = null;
var currentParent = null;
var currentConditional = null;
var currentX;
var currentY;
var initX;
var initY;
var firstX;
var firstY;

var scopeRadarY = 18; // deprecated soon
var scopeRadarX = 18; // deprecated soon
var minSizeArrow = 25;
let separations_between_conditionals = 30;
let scope_listenerXY = 30;
var flowchartBackground = 'white';
var flowchartBorderItemColor = "rgb(202, 200, 200)";

//test
const imageTest = new Image();
imageTest.src = '../assets/test.png';

// exportation
function getItemsFlowchart(){
	// localStorage - mememto - 
	return [...itemsFlowchart];
}

// importation
function updateFlowchart(items){
	itemsFlowchart = items;
	updateCanvas(currentCoordX, currentCoordY);
}

function clearFlowchart(){
	itemsFlowchart = [];
	updateCanvas(currentCoordX, currentCoordY);
	return true;
}

class FlowchartEvents{
	constructor(evts = []){
		this.obs = [];
		this.events = evts;
	}
	activateTrigger(name,obj){
		this.events.forEach(evt => {
			if (evt == name) {
				this.obs.forEach(observer => {
					if(evt == observer.name){
						observer.callback(obj);
					}
				})
			}
		})
	}
	on(eventName,callback){
		this.events.forEach(evt => {
			if (evt == eventName) {
				this.obs.push({
					name : evt,
					callback
				})
			}
		})
	}
}
const flowchartEvents = new FlowchartEvents([
	'start drag',
	'start grab',
	'item added',
	'item deleted',
	'item clicked',
	'reject item creation'
]);

class ExternalItemInteraction{
	constructor(item){
		this.referenceExternalComponent = null;
		this.heightElemt = 30;
		this.widthElemt = 80;
		this.generalSeparation = 7;
		this.createExternalExtention(item);
		this.internalItem = item;
	}
	createExternalExtention(item) {
		let computedItemValues = getComputedValuesFlowchart(item);
		let div = document.createElement('div');
		let heightElemt = this.heightElemt
		let widthElemt = this.widthElemt;
		let generalSeparation = this.generalSeparation;
		div.classList.add(CLASS_EXTERNAL_INTERACTION_ITEM, 'hide');
		div.style.top = `${computedItemValues.y - heightElemt - generalSeparation}px`;
		div.style.left = `${computedItemValues.x + (computedItemValues.width / 2) - (widthElemt / 2)}px`;
		let container = canvas.parentNode;
		div.innerHTML = 'ext';
		this.referenceExternalComponent = div;
		container.append(div);
		this.#setControllers();
	}
	updateCoords(item){
		let computedItemValues = getComputedValuesFlowchart(item);
		let heightElemt = this.heightElemt
		let widthElemt = this.widthElemt;
		let generalSeparation = this.generalSeparation;
		this.referenceExternalComponent.style.top = `${computedItemValues.y - heightElemt - generalSeparation}px`;
		this.referenceExternalComponent.style.left = `${computedItemValues.x + (computedItemValues.width / 2) - (widthElemt / 2)}px`;
	}
	#setControllers(){
		let component = this.referenceExternalComponent;
		component.addEventListener('mouseleave',() => {
			this.hideExternalInteraction();
			this.internalItem.showingExternalInteraction = false;
		})
	}
	updatePositionExternalExtention(item) {
		let computedItemValues = getComputedValuesFlowchart(item);
		let heightElemt = 30;
		let widthElemt = 80;
		let generalSeparation = 7;
		this.referenceExternalComponent.style.top = `${computedItemValues.y - heightElemt - generalSeparation}px`;
		this.referenceExternalComponent.style.left = `${computedItemValues.x + (computedItemValues.width / 2) - (widthElemt / 2)}px`;
	}
	showExternalInteraction() {
		this.referenceExternalComponent.classList.remove('hide');
	}
	hideExternalInteraction(){
		this.referenceExternalComponent.classList.add('hide');
	}
	setStateRenderExtenrnalInteraction(state) {
		this.externalItemInteraction = state;
	}
}

class ItemFlowchart {
	constructor(x, y, width, height, parentID,type, badge, level, evtName) {
		if (!parentID) {
			console.info('item created without parentID');
			this.parentID = 'item-1';
		}
		this.type = type;
		this.badge = badge;
		this.level = level; // working for three
		this.parentID = parentID;
		this.id = generateID();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.externalItemInteractionActive = false;
		this.evtName = evtName;

		//configurations always down and width conection
		this.currentModConnection = 'line-break';
		this.currentPercentage = null;
		this.currentSide = null;
		this.parentPercentage = null;
		this.parentSide = null;
		this.showingExternalInteraction = false; 
		this.externalItem = null;
		this.isHover = false;

		/* connections starting with current item to parent */
		if (this.type == FLOWCHART_LINEAL_FLOW) {
			this.parentPercentage = 50;
			this.currentPercentage = 50;
			this.currentSide = 'top';
			this.parentSide = 'bottom';
		}
		else if (this.type == FLOWCHART_SIMPLE_CONDITIONAL_FLOW) {
			this.parentPercentage = 50;
			this.parentSide = 'bottom';
			this.currentPercentage = 50;
			this.currentSide = 'top';
		}
		/* connections starting with parent item to childs */
		else if (this.type === FLOWCHART_PARALLEL_FLOW) {
			this.parentPercentage = 50;
			this.currentPercentage = 50;
			this.currentSide = 'top';
			this.parentSide = 'bottom';
		}

		/* iniitial state for badges */
		if (this.badge == FLOWCHART_CONDITIONAL_YES) {
			this.parentPercentage = 25;
			this.parentSide = 'bottom';
			this.currentPercentage = 50;
			this.currentSide = 'top';
		}
		else if (this.badge == FLOWCHART_CONDITIONAL_NO) {
			this.parentPercentage = 75;
			this.parentSide = 'bottom';
			this.currentPercentage = 50;
			this.currentSide = 'top';
		}
		
		// init item dont need the configuration written up of this
		if (this.parentID == FIRST_ELEMENT_ID_FLOWCHART) {
			this.parentSide = 'bottom';
			this.parentPercentage = 50;
			this.currentPercentage = 50;
			this.currentSide = 'bottom';
		}

		if (this.externalItemInteractionActive) {
			this.externalItem = new ExternalItemInteraction(this);
		}
	}
	printShadow(){
		ctx.shadowColor = 'gray';
		ctx.shadowBlur = 15;
	}
	printCard() {
		let computedSelfValues = getComputedValuesFlowchart(this);
		let selfX = computedSelfValues.x;
		let selfY = computedSelfValues.y;
		let selfWidth = computedSelfValues.width;
		let selfHeight = computedSelfValues.height;

		let colorEvt = 'black'; // default color if dont found
		configurationsComponents.forEach(com => {
			if (com.name === this.evtName) {
				colorEvt = com.mainColor;
			}
		})

		ctx.lineWidth = 2;
		if (triggerInteraction && currentItemSelected.id === this.id && this.isHover) {
			ctx.strokeStyle = colorEvt;
		} else {
			ctx.strokeStyle = 'rgb(242, 245, 247)';
		}
		ctx.fillStyle = flowchartBackground;
		roundRect(ctx, selfX, selfY, selfWidth, selfHeight);
		ctx.shadowBlur = 0;
		ctx.fill();
		ctx.strokeStyle = colorEvt;
		ctx.fillStyle = colorEvt;
		roundRect(ctx, selfX, selfY, 50 * scaleFactorX, selfHeight);
		ctx.fill();
		ctx.fillStyle = colorEvt;
		ctx.font = `${13 * scaleFactorX}px arial`;
		ctx.fillText('/* comentario */', selfX + (60 * scaleFactorX), selfY + (selfHeight / 2) - (12 * scaleFactorX));
		ctx.fillStyle = 'black';
		ctx.font = `${13 * scaleFactorX}px arial`;
		ctx.fillText('Texto referencia , hola como', selfX + (60 * scaleFactorX), selfY + (selfHeight / 2) + (6 * scaleFactorX));
		ctx.fillText('estas?, estas bien...', selfX + (60 * scaleFactorX), selfY + (selfHeight / 2) + (20 * scaleFactorX));
	}
	renderConnections(){
		let currentParentData = itemsFlowchart.find(item => item.id === this.parentID);
		// the first item doesnt need to write a arrow because dont have a parent
		if (this.parentID !== FIRST_ELEMENT_ID_FLOWCHART) {
			ctx.strokeStyle = flowchartBorderItemColor;
			ctx.lineWidth = 2;
			if (currentParentData.type === FLOWCHART_LINEAL_FLOW || currentParentData.type === FLOWCHART_SIMPLE_CONDITIONAL_FLOW) {
				drawLineFlowchart('line-break', this, currentParentData);
			}
			else if (currentParentData.type === FLOWCHART_FIRST_ITEM) {
				drawArrowConnectionForFistItemConnection(currentParentData, this, 'curve');
			}
			// parallel process -> i heard that it mean contenxt
			if (this.type === FLOWCHART_PARALLEL_FLOW) {
				drawArrowsForParallelFlowItem(this, 'curve');
			}
		}
	}
	render(){
		// take a look how is the order 
		this.printShadow();
		this.printCard();

		if (attachable) {
			if (currentParent.id === this.id) {
				this.activateSignalAttachement();
			}
		}

		// reature external item
		if (this.externalItemInteractionActive && this.showingExternalInteraction) {
			this.externalItem.updateCoords(this)
			this.externalItem.showExternalInteraction();
		}else{
			if (this.externalItemInteractionActive){
				this.externalItem.hideExternalInteraction();
			}
		}

	}
	updateCoords(x, y){
		this.x = x;
		this.y = y;
	}
	activateSignalAttachement(){
		let computedSelfValues = getComputedValuesFlowchart(this);
		let selfX = computedSelfValues.x;
		let selfY = computedSelfValues.y;
		let selfWidth = computedSelfValues.width;
		let selfHeight = computedSelfValues.height;
		
		ctx.beginPath();
		if (this.type === FLOWCHART_LINEAL_FLOW || this.type === FLOWCHART_PARALLEL_FLOW || this.type === FLOWCHART_FIRST_ITEM) {
			ctx.arc(selfX + (selfWidth / 2), selfY + selfHeight, 5, 0, 2 * Math.PI);
		}
		else if (this.type === FLOWCHART_SIMPLE_CONDITIONAL_FLOW){
			if (currentConditional  === FLOWCHART_CONDITIONAL_YES) {
				ctx.arc(selfX + (selfWidth / 2) - separations_between_conditionals, selfY + selfHeight, 5, 0, 2 * Math.PI);
			}
			else if (currentConditional === FLOWCHART_CONDITIONAL_NO) {
				ctx.arc(selfX + (selfWidth / 2) + separations_between_conditionals, selfY + selfHeight, 5, 0, 2 * Math.PI);
			}
		}
		ctx.stroke();
	}
}

// still need test
function removeNode(id) {
	let parent = itemsFlowchart.find(item => item.id === id);
	if (!parent) return;
	let initLevelToDelete = parent.level + 1;
	const deleteItemsInParent = (level, parent_) => {
		let deletedItems = [];
		for (const item of itemsFlowchart) {
			if (item.level === level && item.parentID === parent_.id) {
				itemsFlowchart = itemsFlowchart.filter(b => b.parentID !== parent_.id);
				deletedItems.push(item);
			}
		}
		for (const item of deletedItems) {
			deleteItemsInParent(level + 1, item);
		}
	}
	deleteItemsInParent(initLevelToDelete, parent);
}

function getComputedValuesFlowchart(item){
	return {
		x: (item.x + currentCoordX) * scaleFactorX,
		y: (item.y + currentCoordY) * scaleFactorY,
		width : item.width * scaleFactorX,
		height : item.height * scaleFactorY,
	}
}

var zoomFactor = 1;
var scaleFactorX = 1;
var scaleFactorY = 1;
function flowchartZoomin(factor){
	zoomFactor += factor;
	scaleFactorX = zoomFactor;
	scaleFactorY = zoomFactor;
	updateCanvas(currentCoordX , currentCoordY);
}

function flowchartZoomout(factor){
	zoomFactor -= factor;
	scaleFactorX = zoomFactor;
	scaleFactorY = zoomFactor;
	updateCanvas(currentCoordX, currentCoordY);
}

// dom elemet have a data-type , this function read this data-type and convert to a constant values that undertand the engine
function getItemTypeFlowchart(dataType){
	switch(dataType){
		case DATA_TYPE_LINEAL_FLOW:
			return FLOWCHART_LINEAL_FLOW;
		case DATA_TYPE_SIMPLE_CONDITIONAL:
			return FLOWCHART_SIMPLE_CONDITIONAL_FLOW;
		case DATA_TYPE_PARALLEL_FLOW:
			return FLOWCHART_PARALLEL_FLOW;
	}
}

function generateID(){
	return `item-${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random()*100)}`;
}

function createItemFlowchart(x, y, width, height, parentID, type = FLOWCHART_LINEAL_FLOW, badge = 0, level = 1, evtName) {
	let item = new ItemFlowchart(x, y, width, height,parentID, type, badge, level, evtName);
	flowchartEvents.activateTrigger('item added',item);
	itemsFlowchart.push(item);
}

function updateCanvas(coordX = 0, coordY = 0) {
	ctx.fillStyle = 'rgb(242, 245, 247)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	// layer 1
	itemsFlowchart.forEach(item => {
		item.renderConnections();
	})
	// layer 2
	itemsFlowchart.forEach(item => {
		item.render(coordX, coordY);
	})
}

// deprecated function
function verifyMouseOverConditionalItem(item, canvasDetails, currentX, currentY){
	let itemX = (item.x + currentCoordX) * scaleFactorX;
	let itemY = (item.y + currentCoordY) * scaleFactorY;
	let itemWidth = item.width * scaleFactorX;
	let itemHeight = item.height * scaleFactorY;
	// calculations of center points of listeners
	let yesX = itemX + ((itemWidth / 2) - separations_between_conditionals);
	let noX = itemX + ((itemWidth / 2) + separations_between_conditionals);
	let yesY = itemY + itemHeight, noY = itemY + itemHeight;
	// validations yes
	if (canvasDetails.left + yesX - (scope_listenerXY / 2) < currentX && canvasDetails.left + yesX + (scope_listenerXY / 2) > currentX && yesY - (scope_listenerXY / 2) + canvasDetails.y < currentY && currentY < yesY + (scope_listenerXY / 2) + canvasDetails.top) {
		currentConditional = FLOWCHART_CONDITIONAL_YES;
		return true;
	}
	// validations no
	if (canvasDetails.left + noX - (scope_listenerXY / 2) < currentX && canvasDetails.left + noX + (scope_listenerXY / 2) > currentX && noY - (scope_listenerXY / 2) + canvasDetails.y < currentY && currentY < noY + (scope_listenerXY / 2) + canvasDetails.top){
		currentConditional = FLOWCHART_CONDITIONAL_NO;
		return true;
	}
	return false;
}

function verifyMouseOverItem(item, canvasDetails, currentX, currentY){
	let itemX = (item.x + currentCoordX) * scaleFactorX;
	let itemY = (item.y + currentCoordY) * scaleFactorY;
	let itemWidth = item.width * scaleFactorX;
	let itemHeight = item.height * scaleFactorY;
	let isOverItem = false;
	if (canvasDetails.left + itemX < currentX && currentX < canvasDetails.left + itemX + itemWidth && canvasDetails.y + itemY < currentY && canvasDetails.y + itemY + itemHeight > currentY) {
		isOverItem = true;
	}
	// for external html actions in card of flowchart
	if (item.externalItemInteractionActive && !isOverItem){
		if (item.showingExternalInteraction) {
			let computedItemValues = getComputedValuesFlowchart(item);
			let ratio = 90;
			let centerX = computedItemValues.x + percentageValue(50, computedItemValues, 'bottom');
			let centerY = computedItemValues.y + computedItemValues.height;
			if(centerX - ratio < currentX - canvasDetails.left && centerX + ratio > currentX - canvasDetails.left && centerY - ratio < currentY - canvasDetails.y && centerY + ratio > currentY - canvasDetails.y){
				// still nothing
			}else{
				item.showingExternalInteraction = false;
			}
		}
	}
	return isOverItem;
}

function verificationMouseOverItemV2(item, draggableItem, canvasDetails, currentX, currentY){
	let ratioAmplification = 18 * scaleFactorX; // for now dont care if multiply for scaleFactor in x or y
	let computedItemValues = getComputedValuesFlowchart(item);
	let availableAdjuntSite = 'bottom';
	let isOverItem = false;

	//let initCoordsVerification = whereValuesV2()

	// always need to be bottom for limitations of the engine
	function mainVerification(center, itemCenterYPosition){
		let returned = false;
		if (center - ratioAmplification < currentX - canvasDetails.left && center + ratioAmplification > currentX - canvasDetails.left && itemCenterYPosition - ratioAmplification < currentY - canvasDetails.y && itemCenterYPosition + ratioAmplification > currentY - canvasDetails.y)
			returned = true;
		return returned;
	}
	
	if (item.type == FLOWCHART_LINEAL_FLOW || item.type == FLOWCHART_FIRST_ITEM){
		let center = computedItemValues.x + percentageValue(FLOWCHART_SIMPLE_PERCENTAGE_ADJUNT, computedItemValues, availableAdjuntSite);
		let itemCenterYPosition = computedItemValues.y + computedItemValues.height; 
		if (mainVerification(center, itemCenterYPosition)) {
			isOverItem = true;
		}
	}
	else if (item.type == FLOWCHART_SIMPLE_CONDITIONAL_FLOW) {
		let center = computedItemValues.x + percentageValue(FLOWCHART_SIMPLEC_PERCENTAGE_YES_CONTROL_ADJUNT, computedItemValues, availableAdjuntSite);
		let itemCenterYPosition = computedItemValues.y + computedItemValues.height;
		let isYes = mainVerification(center, itemCenterYPosition);
		if (isYes) {
			currentConditional = FLOWCHART_CONDITIONAL_YES;
			isOverItem = true;
		}
		center = computedItemValues.x + percentageValue(FLOWCHART_SIMPLEC_PERCENTAGE_NO_CONTROL_ADJUNT, computedItemValues, availableAdjuntSite);
		itemCenterYPosition = computedItemValues.y + computedItemValues.height;
		let isNo = mainVerification(center, itemCenterYPosition);
		if (isNo) {
			currentConditional = FLOWCHART_CONDITIONAL_NO;
			isOverItem = true;
		}
	}
	else if (item.type == FLOWCHART_PARALLEL_FLOW) {
		let center = computedItemValues.x + percentageValue(FLOWCHART_PARALLEL_PERCENTAGE_ADJUNT, computedItemValues, availableAdjuntSite);
		let itemCenterYPosition = computedItemValues.y + computedItemValues.height;
		if (mainVerification(center, itemCenterYPosition)) {
			isOverItem = true;
		}
	}
	return isOverItem;
}

const WhereValues =  {
	'top': (values) => {
		return values.y;
	},
	'bottom': (values) => {
		return values.y + values.height;
	},
	'left': (values) => {
		return values.x;
	},
	'right': (values) => {
		return values.x + values.width;
	}
}

const whereValuesV2 = (side, values, percentage) => {
	const scopes = {
		'right': (values, percentage) => {
			return {
				x : values.x + values.width,
				y: values.y + (values.height * percentage / 100)
			}
		},
		'left': (values, percentage) => {
			return {
				x: values.x,
				y: values.y + (values.height * percentage / 100)
			}
		},
		'bottom': (values, percentage) => {
			return {
				x: values.x + (values.width * percentage / 100),
				y: values.y + values.height
			}
		},
		'top': (values, percentage) => {
			return {
				x: values.x + (values.width * percentage / 100),
				y: values.y
			}
		}
	}
	return scopes[side](values, percentage);
}

const percentageValue = (percentage, values, where) => {
	switch (where) {
		case 'top': return (values.width * percentage / 100);
		case 'bottom': return (values.width * percentage / 100);
		case 'left': return (values.height * percentage / 100);
		case 'right': return (values.height * percentage / 100);
		case 'width': return (values.width * percentage / 100);
		case 'height': return (values.height * percentage / 100);
		default : return 0;
	}
}

function drawArrowConnectionForFistItemConnection(item, parentItem, type){
	let currentType = type ?? 'line';
	let computedItemValues = getComputedValuesFlowchart(item); // parent 
	let computedParentValues = getComputedValuesFlowchart(parentItem); // item 
	ctx.beginPath();
	let initCoords = whereValuesV2('right', computedItemValues, 50);
	let endCoords = whereValuesV2('left', computedParentValues, 50);
	let x_ = initCoords.x;
	let y_ = initCoords.y;
	let xp_ = endCoords.x;
	let yp_ = endCoords.y;
	let cp1 = { x: x_ + 100, y: y_  };
	let cp2 = { x: xp_ - 100, y: yp_  };
	ctx.moveTo(x_, y_);
	if (currentType === 'line') {
		ctx.lineTo(computedParentValues.x + (computedParentValues.width / 2), computedParentValues.y);
	}
	else if (currentType === 'curve'){ 
		ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, xp_, yp_);
	}
	ctx.moveTo(xp_ - 3, yp_);
	ctx.lineTo(xp_ - 10, yp_ + 10);
	ctx.moveTo(xp_ - 3, yp_);
	ctx.lineTo(xp_ - 10, yp_ - 10);
	ctx.stroke();
	ctx.closePath();
}

function drawArrowsForParallelFlowItem(item, type){
	let _type = type ?? 'line';
	ctx.beginPath();
	ctx.lineWidth = 2;
	let computedItemValues = getComputedValuesFlowchart(item);
	let childOnLevelDown = itemsFlowchart.filter(elem => elem.level === item.level + 1 && elem.parentID === item.id);
	if (childOnLevelDown.length === 0) {
		return;
	}else {
		let itemsCoords = whereValuesV2('right', computedItemValues, 50);
		let x_ = itemsCoords.x;
		let y_ = itemsCoords.y;
		childOnLevelDown.forEach(leaf => {
			let computedLeafParent = getComputedValuesFlowchart(leaf);
			let leafCoords = whereValuesV2('left',computedLeafParent, 50);
			let x = leafCoords.x;
			let y = leafCoords.y;
			let x0c = x - 190;
			let y0c = y - 0;
			let x1c = x_ + 130;
			let y1c = y_ + 0;
			ctx.moveTo(x_, y_ );
			if (_type === 'line') {
				ctx.lineTo(x, y);
			}
			else if(_type === 'curve'){
				ctx.bezierCurveTo(x1c, y1c, x0c, y0c, x, y);
			}
			ctx.moveTo(x - 3, y);
			ctx.lineTo(x - 10, y + 10);
			ctx.moveTo(x - 3, y);
			ctx.lineTo(x - 10, y - 10);
			
			ctx.lineWidth = 2;
		})
		ctx.stroke();
		ctx.closePath();
	}
}

function calculateYDistanceBetweenTwoItems(item1, parentItem){
	// down
	if (item1.y > parentItem.y + parentItem.height) {
		return item1.y - parentItem.y - parentItem.height;
	}
	// up
	else {
		return item1.y + item1.height - parentItem.y;
	}
}

function drawLineFromItemToPoint(item, lineY){
	if (item.currentSide == 'top') {
		ctx.moveTo(item.x + percentageValue(item.currentPercentage, item, item.currentSide), WhereValues[item.currentSide](item));
		ctx.lineTo(item.x + percentageValue(item.currentPercentage, item, item.currentSide), lineY);
	}
	else if (item.currentSide == 'bottom') {
		ctx.moveTo(item.x + percentageValue(item.currentPercentage, item, item.currentSide), WhereValues[item.currentSide](item));
		ctx.lineTo(item.x + percentageValue(item.currentPercentage, item, item.currentSide), lineY);
	}
	else if (item.currentSide == 'left') {
		ctx.moveTo(item.x, item.y + percentageValue(item.currentPercentage, item, item.currentSide));
		ctx.lineTo(item.x + item.width, lineY);
	}
	else if (item.currentSide == 'right') {
		ctx.moveTo(item.x + item.width, item.y + percentageValue(item.currentPercentage, item, item.currentSide));
		ctx.lineTo(item.x + item.width, lineY);
	}
}

function drawLineFromPointToItem(parentItem, x, item){
	if (item.parentSide == 'top') {
		ctx.lineTo(x, parentItem.y);
	}
	else if (item.parentSide == 'bottom') {
		ctx.lineTo(x, parentItem.y + parentItem.height);
	}
	else if (item.parentSide == 'left') {
		ctx.lineTo(x, parentItem.y + percentageValue(item.parentPercentage, parentItem, item.parentSide));
	}
	else if (item.parentSide == 'right') {
		ctx.lineTo(x, parentItem.y + percentageValue(item.parentPercentage, parentItem, item.parentSide));
	}
}

function drawHorizontalLineFromPointToPoint(lineFromX, currentY){
	ctx.lineTo(lineFromX, currentY);
}

function drawHorizontalConnectionsFromPointToPoint(item, parentItem, currentY){
	let distanceItem = item.x + percentageValue(item.currentPercentage, item, item.currentSide);
	let distanceParent = parentItem.x + percentageValue(item.parentPercentage, parentItem, item.parentSide);
	//item right
	if (distanceItem > distanceParent) {
		ctx.lineTo(distanceParent, currentY);
	}else{
		ctx.lineTo(distanceParent, currentY);
	}
	ctx.lineTo(distanceParent, currentY);
	return distanceParent;
}

function drawBorderedLineFromItemToPoint(parentItem, item){
	let padding = 13;
	ctx.moveTo(parentItem.x + (percentageValue(item.parentPercentage, parentItem, item.parentSide)), parentItem.y + parentItem.height);
	ctx.lineTo(parentItem.x + (percentageValue(item.parentPercentage, parentItem, item.parentSide)), parentItem.y + parentItem.height + padding);
	let distanceItem = item.x + percentageValue(item.currentPercentage, item, item.currentSide);
	let distanceParent = parentItem.x + percentageValue(item.parentPercentage, parentItem, item.parentSide);
	//item right
	if (distanceItem > distanceParent) {
		ctx.lineTo(parentItem.x + parentItem.width + padding, parentItem.y + parentItem.height + padding);
		ctx.lineTo(parentItem.x + parentItem.width + padding, parentItem.y - padding);
	} else {
		ctx.lineTo(parentItem.x - padding, parentItem.y + parentItem.height + padding);
		ctx.lineTo(parentItem.x - padding, parentItem.y - padding);
	}
}

function drawLineFlowchart(type, item, parentItem){
	ctx.beginPath();
	let computedItemValues = { ...item, ...getComputedValuesFlowchart(item)};
	let computedParentValues = { ...parentItem, ...getComputedValuesFlowchart(parentItem)};
	// console.log({computedItemValues, computedParentValues, item, parentItem})
	if (type === 'line-break') {
		// item up from parent
		if (computedItemValues.y < computedParentValues.height + computedParentValues.y) {
			item.parentSide = 'top';
			computedItemValues.currentSide = 'top';
			drawLineFromItemToPoint(computedItemValues, computedParentValues.y + (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2));
			let currentX = drawHorizontalConnectionsFromPointToPoint(computedItemValues, computedParentValues, computedParentValues.y + (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2))
			drawLineFromPointToItem(computedParentValues, currentX, computedItemValues);
			/*
			if (item.parentSide == 'bottom') {
				drawBorderedLineFromItemToPoint(computedParentValues, computedItemValues);
			}
			else if (item.parentSide == 'top') {
				drawLineFromItemToPoint(computedItemValues, computedParentValues.y + (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2));
				let currentX = drawHorizontalConnectionsFromPointToPoint(computedItemValues, computedParentValues, computedParentValues.y + (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2))
				drawLineFromPointToItem(computedParentValues, currentX, computedItemValues);
			}
			*/
		}
		// item down from parent 
		else {
			item.parentSide = 'bottom';
			computedItemValues.parentSide = 'bottom';
			drawLineFromItemToPoint(computedItemValues, computedItemValues.y - (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2));
			let currentX = drawHorizontalConnectionsFromPointToPoint(computedItemValues, computedParentValues, computedItemValues.y - (calculateYDistanceBetweenTwoItems(computedItemValues, computedParentValues) / 2))
			drawLineFromPointToItem(computedParentValues, currentX, computedItemValues);
			//drawLineFromItemToPoint(item, item.y + item.height + (calculateYDistanceBetweenTwoItems(item, parentItem)) / 2);
			//right
			if (computedParentValues.x + percentageValue(item.currentPercentage, computedParentValues, item.currentSide) > computedItemValues.x + percentageValue(item.currentPercentage, computedItemValues, item.currentSide)) {

			}
			//left
			else {

			}
		}
	}
	else if (type === 'line') {
		console.error('still in development');
	}
	ctx.stroke();
	ctx.closePath();
}

function validateAdjunt(currentParent, itemsFlowchart){
	if (currentParent.type === FLOWCHART_LINEAL_FLOW || currentParent.type === FLOWCHART_FIRST_ITEM) {
		let haveChilds = itemsFlowchart.filter(item => item.parentID === currentParent.id);
		if (haveChilds.length > 0) {
			return false;
		}
		return true;
	}
	else if(currentParent.type === FLOWCHART_SIMPLE_CONDITIONAL_FLOW) {
		let haveTwoChilds = itemsFlowchart.filter(item => item.parentID === currentParent.id);
		if (haveTwoChilds.length >= 2) {
			return false;
		}
		return true;
	}
	else if(currentParent.type === FLOWCHART_PARALLEL_FLOW) {
		let provisionalLimit = 5;
		let childs_ = itemsFlowchart.filter(item => item.parentID === currentParent.id);
		if (childs_.length === provisionalLimit) {
			return false;
		}
		return true;
	}
	console.warn('current parentItem doesnt have a type');
	return true;
}

function activateDragabbleItems() {
	let draggables = document.querySelectorAll(`.${CLASS_ITEM_DRAGGABLE}`);
	draggables.forEach(item => {
		item.addEventListener('mousedown', function (evt) {
			dragging = true;
			let itemDetails = item.getBoundingClientRect();
			let clone = item.cloneNode(true);
			clone.classList.add('dragging');
			clone.style.left = `${itemDetails.left}px`;
			clone.style.top = `${itemDetails.top}px`;
			currentExternalSelected  = clone;
			flowchartEvents.activateTrigger('start drag', { item, clone });
			document.body.appendChild(clone);
		})
	})
}

function mousedownFlowchart(evt) {
	currentX = evt.clientX;
	currentY = evt.clientY;
	firstX = evt.clientX;
	firstY = evt.clientY;
	let canvasDetails = canvas.getBoundingClientRect();
	if (dragging) return;
	itemsFlowchart.forEach(item => {
		if (verifyMouseOverItem(item, canvasDetails, currentX, currentY)) {
			currentItemSelected = item;
			// i divided for scale factor for normal scale but -> default value is one
			initX = (currentX / scaleFactorX) - item.x;
			initY = (currentY / scaleFactorX) - item.y;
			grabbing = true;
		}
	})
	if (!grabbing){
		movingCanvas = true;
	}
}

var initCoordX = 0;
var initCoordY = 0;
var currentCoordX = 0;
var currentCoordY = 0;
function mousemoveFlowchart(evt) {
	currentX = evt.clientX;
	currentY = evt.clientY;
	document.body.style.cursor = 'default';
	if(grabbing){
		if (!currentItemSelected) return;
		document.body.style.cursor = 'grabbing';
		let itemX = ((evt.clientX / scaleFactorX) - initX);
		let itemY = ((evt.clientY / scaleFactorX) - initY);
		currentItemSelected.updateCoords(itemX, itemY);
		updateCanvas(currentCoordX, currentCoordY);
	}
	else if (movingCanvas){
		document.body.style.cursor = 'move';
		// i divide for the scale factor because i need the canvas in regular movement when scaled
		let diffX = (evt.clientX / scaleFactorX) - (firstX / scaleFactorX);
		let diffY = (evt.clientY / scaleFactorX) - (firstY / scaleFactorX);
		currentCoordX = (initCoordX + diffX);
		currentCoordY = (initCoordY + diffY);
		// the current quandrant of my canvas
		updateCanvas(currentCoordX, currentCoordY);
	}
	else{
		let canvasDetails = canvas.getBoundingClientRect();
		itemsFlowchart.forEach(item => {
			if (verifyMouseOverItem(item, canvasDetails, currentX, currentY)) {
				document.body.style.cursor = 'pointer';
				triggerInteraction = true;
				currentItemSelected = item;
				item.isHover = true;
				if (item.externalItemInteractionActive) {
					item.showingExternalInteraction = true;
				}
			}else{
				item.isHover = false;
			}
		})
		updateCanvas(currentCoordX, currentCoordY);
		triggerInteraction = false;
	}
}

function mouseupFlowchart(evt) {
	if (firstX === evt.clientX && firstY === evt.clientY && grabbing) {
		flowchartEvents.activateTrigger('item clicked', {});
		document.body.style.cursor = 'pointer';
	}
	if(movingCanvas){
		initCoordX = currentCoordX;
		initCoordY = currentCoordY;
	}
	movingCanvas = false;
	grabbing = false;
	triggerInteraction = false;
}

function mouseleaveFlowchart(evt){
	if (movingCanvas) {
		initCoordX = currentCoordX;
		initCoordY = currentCoordY;
	}
	movingCanvas = false;
	grabbing = false;
	triggerInteraction = false;
}

function mousemoveDraggableFlowchartEvent(evt){
	let someoneAttachable = false;
	let canvasDetails = canvas.getBoundingClientRect();
	if (dragging) {
		currentExternalSelected.style.top = `${evt.clientY}px`;
		currentExternalSelected.style.left = `${evt.clientX}px`;
		itemsFlowchart.forEach(item => {
			if (item.type === FLOWCHART_LINEAL_FLOW) {
				let scopeddata = {
					x: item.x - scopeRadarX,
					y: item.y - scopeRadarY,
					width: item.width + (2 * scopeRadarX),
					height: item.height + (2 * scopeRadarY)
				}
				if (verifyMouseOverItem(scopeddata, canvasDetails, currentX, currentY)) {
					currentParent = item;
					attachable = true;
					someoneAttachable = true;
					updateCanvas(currentCoordX, currentCoordY);
				}
			}
			else if (item.type === FLOWCHART_SIMPLE_CONDITIONAL_FLOW) {
				if (verificationMouseOverItemV2(item, null, canvasDetails, currentX, currentY)) {
					currentParent = item;
					attachable = true;
					someoneAttachable = true;
					updateCanvas(currentCoordX, currentCoordY);
				}
			}
			else if (item.type === FLOWCHART_PARALLEL_FLOW || item.type === FLOWCHART_FIRST_ITEM) {
				if (verificationMouseOverItemV2(item, null, canvasDetails, currentX, currentY)) {
					currentParent = item;
					attachable = true;
					someoneAttachable = true;
					updateCanvas(currentCoordX, currentCoordY);
				}
			}
		})
		if (!someoneAttachable) {
			updateCanvas(currentCoordX, currentCoordY);
			attachable = false;
			currentParent = null;
		}
	}
}

function mouseupDraggableFlowchartEvent(evt){
	let canvasDetails = canvas.getBoundingClientRect();
	if (dragging) {
		// verify mouse inside canvas
		if (canvasDetails.left < evt.clientX && canvasDetails.width + canvasDetails.left > evt.clientX && canvasDetails.height + canvasDetails.y > evt.clientY && canvasDetails.y < evt.clientY) {
			currentExternalSelected.classList.remove('dragging');
			currentExternalSelected.remove();
			let type = getItemTypeFlowchart(currentExternalSelected.dataset.type);
			let evtName = currentExternalSelected.dataset.event;
			if (attachable) {
				if (validateAdjunt(currentParent, itemsFlowchart)){
					createItemFlowchart(
						((evt.clientX - canvasDetails.left) / scaleFactorX) - currentCoordX,
						((evt.clientY - canvasDetails.top) / scaleFactorY) - currentCoordY,
						250,
						74,
						currentParent.id,
						type,
						currentConditional,
						currentParent.level + 1,
						evtName);
					updateCanvas(currentCoordX, currentCoordY);
				}
				else{
					flowchartEvents.activateTrigger('reject item creation',{})
				}
			}
			dragging = false;
		}else{
			currentExternalSelected.remove();
			dragging = false;
		}
	}
	attachable = false;
	currentConditional = null;
}

function activateEventsFlowchart() {
	canvas.addEventListener('mousedown',mousedownFlowchart);
	canvas.addEventListener('mousemove',mousemoveFlowchart);
	canvas.addEventListener('mouseup',mouseupFlowchart);
	canvas.addEventListener('mouseleave',mouseleaveFlowchart);
	document.addEventListener('mousemove',mousemoveDraggableFlowchartEvent)
	document.addEventListener('mouseup',mouseupDraggableFlowchartEvent)
}

function initFlowchart() {
	activateDragabbleItems();
	// always need the first element for instanciate the flowchart
	createItemFlowchart(560, 180, 250, 74, FIRST_ELEMENT_ID_FLOWCHART, FLOWCHART_FIRST_ITEM, 0, 1, 'conversacion');
	updateCanvas();
	activateEventsFlowchart();
}

initFlowchart();

flowchartEvents.on('start drag',function(obj){
	// console.log(obj);
});

flowchartEvents.on('item added',function(obj){
 	console.log('se hace el evento');
})

flowchartEvents.on('item clicked', function(){
	document.getElementById('sidebar-right').classList.add('--show')
})

flowchartEvents.on('reject item creation', function(){
	console.log('reject attachement to the flowchart')
})

/* external interaction with the flow chart */

btnZoomin.onclick = () => {
	flowchartZoomin(.08);
}

btnZoomout.onclick = () => {
	flowchartZoomout(.08);
}

// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke === 'undefined') {
		stroke = true;
	}
	if (typeof radius === 'undefined') {
		radius = 5;
	}
	if (typeof radius === 'number') {
		radius = { tl: radius, tr: radius, br: radius, bl: radius };
	} else {
		var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
		for (var side in defaultRadius) {
			radius[side] = radius[side] || defaultRadius[side];
		}
	}
	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();
	if (fill) {
		ctx.fill();
	}
	if (stroke) {
		ctx.stroke();
	}

}