/**
 * This class contains the utility function of whiteboard
 * @Copyright 2020  Vidya Mantra EduSystems Pvt. Ltd.
 * @author Suman Bogati <http://www.vidyamantra.com>
 */

class WhiteboardUtility {
  // earlier it waas drawInWhiteboards
  static storeAtMemory(data, wId, freeDrawing) {
    if (!virtualclass.wb[wId].replayObjs) virtualclass.wb[wId].replayObjs = [];
    let toBeSendData = data;
    if (freeDrawing) toBeSendData = WhiteboardProtocol.generateFreeDrawingData(freeDrawing);

    if (Array.isArray(data)) {
      for (let i = 0; i < toBeSendData.length; i += 1) {
        virtualclass.wb[wId].replayObjs.push(toBeSendData[i]);
      }
    } else {
      virtualclass.wb[wId].replayObjs.push(data);
    }
  }

  createFabricNewInstance(wId, canvasDimension) {
    if (virtualclass.wb[wId].canvas && virtualclass.wb[wId].canvas.upperCanvasEl) {
      virtualclass.wb[wId].canvas.dispose();
    }
    delete virtualclass.wb[wId].canvas;
    const options = {
      selection: false,
    };

    if (canvasDimension) {
      options.width = canvasDimension.width;
      options.height = canvasDimension.height;
    }
    virtualclass.wb[wId].canvas = new fabric.Canvas(`canvas${wId}`, options);
    if (roles.hasControls()) {
      virtualclass.wb[wId].attachMouseMovementHandlers();
      console.log('=====> attach handlers with whiteboard id ', wId);
    }
    this.constructor.createCanvasPdfInstance(wId, virtualclass.wb[wId].canvas.upperCanvasEl);
  }

  static createCanvasPdfInstance(wId, mainCanvas) {
    const alreadCreateCanvas = document.querySelector(`#canvas${wId}_pdf`);
    if (alreadCreateCanvas == null) {
      const canvasPdf = document.createElement('canvas');
      canvasPdf.id = `canvas${wId}_pdf`;
      canvasPdf.className = 'pdfs';
      canvasPdf.width = mainCanvas.width;
      canvasPdf.height = mainCanvas.height;
      mainCanvas.parentNode.parentNode.insertBefore(canvasPdf, mainCanvas.parentNode);
    }
  }

  static fitWhiteboardAtScale(wid) {
    // console.log('====> canvas set zoom scale ', virtualclass.zoom.canvasScale);
    virtualclass.wb[wid].canvas.setZoom(virtualclass.zoom.canvasScale);
    if (typeof virtualclass.wb[wid] === 'object') {
      delete virtualclass.wb[wid].myPencil;
      if (virtualclass.wb[wid].replayObjs && virtualclass.wb[wid].replayObjs.length > 0) {
        virtualclass.wbWrapper.replay.replayFromLocalStroage(virtualclass.wb[wid].replayObjs, wid);
      }
    }
  }

  static readyMouseEvent(event, pointer) {
    return new MouseEvent(event, {
      clientX: pointer.x,
      clientY: pointer.y,
      buttons: 1,
      bubbles: true,
      which: 1,
      composed: true,
    });
  }

  closeShapeContainer(elem) {
    this.selectedTool = null;
    const shapeContainer = elem || document.querySelector(`#shapes${virtualclass.gObj.currWb}`);
    if (shapeContainer) {
      shapeContainer.classList.remove('open');
      shapeContainer.classList.add('close');
    }
  }

  static closeTray() {
    const elem = document.querySelector(`#commandToolsWrapper${virtualclass.gObj.currWb} .openTray`);
    if (elem) elem.classList.remove('openTray');
  }

  static openTray(elem) {
    if (elem) elem.classList.add('openTray');
  }

  handleTrayDisplay(element) {
    if (element.classList.contains('openTray')) {
      this.selectedTool = null;
      this.constructor.closeTray();
    } else {
      this.constructor.openTray(element);
    }
  }

  openShapeContainer(elem) {
    this.selectedTool = null;
    const shapeContainer = elem || document.querySelector(`#shapes${virtualclass.gObj.currWb}`);
    if (shapeContainer) {
      shapeContainer.classList.remove('close');
      shapeContainer.classList.add('open');
    }
  }

  initActiveElement(selector, tool) {
    const elem = document.querySelector(selector);
    if (typeof virtualclass.gObj.wbTool[virtualclass.gObj.currWb] === 'undefined') {
      virtualclass.gObj.wbTool[virtualclass.gObj.currWb] = {};
    }
    if (typeof virtualclass.gObj.wbTool[virtualclass.gObj.currWb][tool.type] === 'undefined') {
      elem.addEventListener('click', this.activeElementHandler.bind(this, tool));
      virtualclass.gObj.wbTool[virtualclass.gObj.currWb][tool.type] = true;
    }
  }

  activeElementHandler(tool, ev) {
    this.activeElement(ev, tool);
  }

  activeElement(ev, tool) {
    const wbId = virtualclass.gObj.currWb;
    const prevSelectedTool = document.querySelector(`#t_${tool.type}${wbId} .selected`);
    if (prevSelectedTool != null) {
      prevSelectedTool.classList.remove('selected');
    }

    const currElementValue = ev.target.dataset[tool.prop];
    if (currElementValue != null) {
      ev.target.classList.add('selected');
      this.constructor.updateToolStyle(tool.type, currElementValue, wbId);
      if (tool.type === 'color') {
        document.querySelector(`#t_color${wbId} .disActiveColor`).style.backgroundColor = virtualclass.wb[wbId].toolColor;
      }
      const encodeData = virtualclass.wbWrapper.protocol.encode('ot', { type: tool.type, value: currElementValue });
      WhiteboardMessage.send(encodeData);
    }
  }

  makeActiveTool(byReload, wbId) {
    const selectedElement = document.getElementById(byReload);
    if (!selectedElement) return;
    const wId = wbId || virtualclass.gObj.currWb;
    const activeElement = document.querySelectorAll(`#commandToolsWrapper${wId} .tool.active`);
    for (let i = 0; i < activeElement.length; i += 1) {
      activeElement[i].classList.remove('active');
    }
    if (roles.hasControls()) {
      const shape = document.getElementById(byReload).dataset.tool;
      document.querySelector(`#tool_wrapper${wbId}`).dataset.currtool = shape;
    }
    this.constructor.themeColorShapes(byReload, wId);
    selectedElement.classList.add('active');
    // localStorage.activeTool = selectedElement.id;
  }

  handleActivateTool(wbId) {
    let activeWbTool = localStorage.getItem('activeTool');
    if (activeWbTool !== null && activeWbTool.indexOf(wbId) > -1) {
      this.makeActiveTool(activeWbTool, wbId);
      const selectedTool = activeWbTool.split('_')[1];
      virtualclass.wb[wbId].selectedTool = selectedTool;
      if (virtualclass.wb[wbId].selectedTool !== 'activeAll') {
        virtualclass.wb[wbId].activeAllObj.disable(wbId);
      }
    } else if (virtualclass.wb[wbId].selectedTool) {
      activeWbTool = `t_${virtualclass.wb[wbId].selectedTool}${wbId}`;
      this.makeActiveTool(activeWbTool, wbId);
      if (virtualclass.wb[wbId].selectedTool !== 'activeAll') {
        virtualclass.wb[wbId].activeAllObj.disable(wbId);
      }
    }

    if (virtualclass.wb[wbId].selectedTool && virtualclass.wb[wbId].selectedTool === 'text') {
      WhiteboardUtility.fontSizeSelector(wbId);
    } else if (virtualclass.wbWrapper.shapes.indexOf(virtualclass.wb[wbId].selectedTool) > -1) {
      WhiteboardUtility.strokeSizeSelector(wbId);
    }

    if (virtualclass.wb[wbId].toolColor) {
      console.log('====> apply color background')
      document.querySelector(`#t_color${wbId} .disActiveColor`).style.backgroundColor = virtualclass.wb[wbId].toolColor;
    }
  }

  // fabric.js, whiteboard changes, new changes, critical whiteboard, critical changes
  static updateToolStyle(attr, value, whiteboardId) { //
    let wId = whiteboardId;
    if (!wId) wId = virtualclass.gObj.currWb;
    if (attr === 'color') {
      virtualclass.wb[wId].toolColor = value;
    } else if (attr === 'strk') {
      virtualclass.wb[wId].strokeSize = value;
    } else if (attr === 'font') {
      virtualclass.wb[wId].fontSize = value;
    }
  }

  static strokeSizeSelector(wId) {
    const wbId = wId || virtualclass.gObj.currWb;
    const fontElement = document.querySelector(`#t_font${wbId}`);
    if (fontElement != null) {
      fontElement.classList.remove('show');
      fontElement.classList.add('hide');
    }
    const strokeElement = document.querySelector(`#t_strk${wbId}`);
    if (strokeElement != null) {
      strokeElement.classList.remove('hide');
      strokeElement.classList.add('show');
    }
    WhiteboardUtility.fontAndStrokeSizeUi('strk', wbId, 'stroke', 'li', virtualclass.wb[wbId].strokeSize);
  }

  static fontAndStrokeSizeUi(tool, wbId, type, elementType, size) {
    const selector = `#t_${tool}${wbId} ${elementType}.selected`;
    const element = document.querySelector(selector);
    if (element != null) {
      element.classList.remove('selected');
    }

    const nextSelector = `#t_${tool}${wbId} ${elementType}[data-${type}='${size}']`;
    const nextElement = document.querySelector(nextSelector);
    if (nextElement != null) {
      nextElement.classList.add('selected');
    }
  }

  static fontSizeSelector(wId) {
    const wbId = wId || virtualclass.gObj.currWb;
    const strokeElement = document.querySelector(`#t_strk${wbId}`);
    if (strokeElement != null) {
      strokeElement.classList.remove('show');
      strokeElement.classList.add('hide');
    }

    const fontElement = document.querySelector(`#t_font${wbId}`);
    if (fontElement != null) {
      fontElement.classList.remove('hide');
      fontElement.classList.add('show');
    }
    WhiteboardUtility.fontAndStrokeSizeUi('font', wbId, 'font', 'span', virtualclass.wb[wbId].fontSize);
  }

  static themeColorShapes(byReload, wId) {
    const tool = byReload.split(/_doc_*/)[0];
    const shapesElem = document.querySelector(`#tool_wrapper${wId}.shapesToolbox`);
    if (tool === 't_line' || tool === 't_circle' || tool === 't_rectangle' || tool === 't_triangle') {
      shapesElem.classList.add('active');
    } else {
      shapesElem.classList.remove('active');
    }
  }

  static deleteActiveObject(event, wId) {
    const whitebaord = virtualclass.wb[wId];
    const activeObject = whitebaord.canvas.getActiveObject();
    whitebaord.canvas.discardActiveObject();
    whitebaord.canvas.remove(activeObject);
    if (event) {
      const encodeData = virtualclass.wbWrapper.protocol.encode('da', virtualclass.gObj.currWb);
      WhiteboardMessage.send(encodeData);
    }
  }
}
