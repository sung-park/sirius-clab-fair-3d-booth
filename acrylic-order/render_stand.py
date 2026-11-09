"""Shelf display inside 50 x 50 x 30 cm.

Front: three real trackers lying on a clear plate.
Back: five clear sheets in a dark slotted plinth.
  1 front case, IP68
  2 E-Ink, guardian contact when lost
  3 main board, IMU behavior and radar vitals
  4 piezo, find
  5 battery, 220mAh rechargeable

Order:
  clear plate     500 x 500 x 8 mm
  dark plinth     440 x ~159 x 22 mm, 5 grooves, pitch 30 mm
  printed sheets  380 x 162 x 5 mm, five pieces
Tallest point is computed and printed.
"""

import math
import bpy

OUT = '/Users/sung-park/Dev/sirius-clab-fair-3d-booth/acrylic-order'
FONT_PATH = '/System/Library/Fonts/Supplemental/AppleGothic.ttf'

PLATE = 0.500
THICK = 0.008

# Plinth and sheets. Groove pitch is the depth of the sculpture.
PLINTH_X = 0.440
PLINTH_Z = 0.022
GROOVE_D = 0.008
SLAB_Z = PLINTH_Z - GROOVE_D
N = 5
PITCH = 0.030
GROOVE_W = 0.007
LIP = 0.016
SHEET_W = 0.380
SHEET_H = 0.162
SHEET_T = 0.005
Y0 = 0.012

PLINTH_Y = LIP + GROOVE_W / 2 + (N - 1) * PITCH + GROOVE_W / 2 + LIP
SHEET_BOTTOM = THICK + PLINTH_Z - GROOVE_D + 0.0004
TOP_MM = (SHEET_BOTTOM + SHEET_H) * 1000

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
FONT = bpy.data.fonts.load(FONT_PATH)


def srgb(hex_color):
    value = int(hex_color.lstrip('#'), 16)
    channels = [((value >> shift) & 255) / 255 for shift in (16, 8, 0)]
    return tuple(channel ** 2.2 for channel in channels)


def new_mat(name, color, rough=0.45, metal=0.0, transmission=0.0, specular=0.2):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = 1.49
    bsdf.inputs['Specular IOR Level'].default_value = specular
    return mat


def assign(obj, mat):
    obj.data.materials.append(mat)


def cube(name, size, loc, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = size
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = obj.modifiers.new('Bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        mod.affect = 'EDGES'
    assign(obj, mat)
    return obj


def text_obj(name, body, size, loc, rot, mat):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.extrude = 0.0002
    curve.resolution_u = 4
    curve.font = FONT
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    assign(obj, mat)
    return obj


def groove_y(index):
    return Y0 + LIP + GROOVE_W / 2 + index * PITCH


ACRYLIC = new_mat('acrylic', srgb('#f7f8f8'), rough=0.045, transmission=1.0, specular=0.28)
# The base plate is the same acrylic, just a touch duller so floor type stays readable.
PLATE_MAT = new_mat('plate', srgb('#f7f8f8'), rough=0.11, transmission=1.0, specular=0.18)
WHITE = new_mat('white', srgb('#f4f3ef'), rough=0.4, specular=0.08)
INK = new_mat('ink', srgb('#1a1c1f'), rough=0.5, specular=0.05)
SCREEN = new_mat('screen', srgb('#d7e3ea'), rough=0.35, specular=0.08)
GREEN = new_mat('pcb', srgb('#1c7a43'), rough=0.55, specular=0.05)
SILVER = new_mat('silver', srgb('#c5c8cc'), rough=0.28, metal=0.85, specular=0.25)
GRAPHITE = new_mat('graphite', srgb('#2c3036'), rough=0.38, metal=0.45, specular=0.2)
ORANGE = new_mat('orange', srgb('#e25b12'), rough=0.48, specular=0.1)
STRAP = new_mat('strap', srgb('#242628'), rough=0.72, specular=0.06)
BLUE = new_mat('callout', srgb('#1a6fd4'), rough=0.6, specular=0.04)
NAVY = new_mat('navy', srgb('#002f7f'), rough=0.65, specular=0.04)
PLINTH_MAT = new_mat('plinth', srgb('#16181a'), rough=0.55, specular=0.1)

cube('plate', (PLATE, PLATE, THICK), (0, 0, THICK / 2), PLATE_MAT, bevel=0.001)

# Slotted plinth: a slab plus ribs, so the grooves are real gaps.
slab_z = THICK + SLAB_Z / 2
cube('plinth-slab', (PLINTH_X, PLINTH_Y, SLAB_Z), (0, Y0 + PLINTH_Y / 2, slab_z), PLINTH_MAT, bevel=0.0008)
rib_h = GROOVE_D + 0.0006
rib_z = THICK + SLAB_Z + rib_h / 2 - 0.0006


def rib(name, y_start, y_end):
    length = y_end - y_start
    cube(name, (PLINTH_X, length, rib_h), (0, (y_start + y_end) / 2, rib_z), PLINTH_MAT)


rib('lip-front', Y0, groove_y(0) - GROOVE_W / 2)
for index in range(N - 1):
    rib(f'rib-{index}', groove_y(index) + GROOVE_W / 2, groove_y(index + 1) - GROOVE_W / 2)
rib('lip-back', groove_y(N - 1) + GROOVE_W / 2, Y0 + PLINTH_Y)

FACE = (math.pi / 2, 0, 0)
SHEET_Z = SHEET_BOTTOM + SHEET_H / 2


def print_card(name, size_xz, x, y, z, mat, bevel=0.0006):
    # Thin card on the visitor face of the sheet. Y is thickness.
    return cube(name, (size_xz[0], 0.00045, size_xz[1]), (x, y, z), mat, bevel=bevel)


# Five sheets. Callouts alternate above and below so the lines do not stack.
# The main board carries both IMU and radar, so that box is the wide one.
NAME_SIZE = 0.0062
BODY_SIZE = 0.0048
STROKE = 0.00115
layers = [
    ('case', 0.023, 0.054, '전면 케이스', ['IP68 방수방진']),
    ('eink', 0.017, 0.074, 'E-Ink', ['분실 시 보호자 연락처 표시']),
    ('board', 0.020, 0.098, '메인보드', ['IMU : On-Device AI 기반 행동 검출', 'Radar : 호흡 수, 심박']),
    ('piezo', 0.013, 0.046, '피에조', ['찾기 경험']),
    ('battery', 0.014, 0.070, '배터리', ['220mAh 충전식 배터리']),
]


def rule(name, sx, sz, x, y, z, mat):
    return cube(name, (sx, 0.00032, sz), (x, y, z), mat)


def callout(index, name, body, box_w, x, face_y, above, part_half, part_z):
    """Hairline box and leader. White ink sits only under the stroke and the type."""
    pad, gap = 0.0036, 0.0023
    box_h = pad + NAME_SIZE + gap + len(body) * BODY_SIZE + max(0, len(body) - 1) * 0.0016 + pad
    if above:
        top = SHEET_BOTTOM + SHEET_H - 0.0045
        box_z = top - box_h / 2
        outer = box_z - box_h / 2
        dot_z = part_z + part_half + 0.0018
    else:
        bottom = THICK + PLINTH_Z + 0.0065
        box_z = bottom + box_h / 2
        outer = box_z + box_h / 2
        dot_z = part_z - part_half - 0.0018
    z0, z1 = sorted((outer, dot_z))
    under_y = face_y + 0.00022
    ink_y = face_y - 0.00018
    for tag, y_pos, mat in (('under', under_y, WHITE), ('ink', ink_y, NAVY)):
        rule(f'{tag}-top-{index}', box_w, STROKE, x, y_pos, box_z + box_h / 2 - STROKE / 2, mat)
        rule(f'{tag}-bot-{index}', box_w, STROKE, x, y_pos, box_z - box_h / 2 + STROKE / 2, mat)
        rule(f'{tag}-left-{index}', STROKE, box_h, x - box_w / 2 + STROKE / 2, y_pos, box_z, mat)
        rule(f'{tag}-right-{index}', STROKE, box_h, x + box_w / 2 - STROKE / 2, y_pos, box_z, mat)
        rule(f'{tag}-line-{index}', STROKE, max(z1 - z0, STROKE), x, y_pos, (z0 + z1) / 2, mat)
    for radius, y_pos, mat, suffix in (
        (0.0017, under_y, WHITE, 'under'),
        (0.00145, ink_y, NAVY, 'ink'),
    ):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=radius, depth=0.00032, vertices=20,
            location=(x, y_pos, dot_z), rotation=(math.pi / 2, 0, 0),
        )
        dot = bpy.context.active_object
        dot.name = f'dot-{suffix}-{index}'
        assign(dot, mat)
    name_z = box_z + box_h / 2 - pad - NAME_SIZE / 2
    text_obj(f'name-under-{index}', name, NAME_SIZE, (x, under_y, name_z), FACE, WHITE)
    text_obj(f'name-{index}', name, NAME_SIZE, (x, ink_y - 0.00028, name_z), FACE, NAVY)
    body_z = name_z - NAME_SIZE / 2 - gap - BODY_SIZE / 2
    for line_index, line in enumerate(body):
        text_obj(f'body-under-{index}-{line_index}', line, BODY_SIZE, (x, under_y, body_z), FACE, WHITE)
        text_obj(f'body-{index}-{line_index}', line, BODY_SIZE, (x, ink_y - 0.00028, body_z), FACE, NAVY)
        body_z -= BODY_SIZE + 0.0016


for index, (key, part_half, box_w, name, body) in enumerate(layers):
    y = groove_y(index)
    cube(
        f'sheet-{index}',
        (SHEET_W, SHEET_T, SHEET_H),
        (0, y, SHEET_Z),
        ACRYLIC,
        bevel=0.00035,
    )
    face_y = y - SHEET_T / 2 - 0.00055
    part_x = -0.128 + index * 0.064
    part_z = SHEET_Z - 0.006
    if key == 'case':
        print_card(f'{key}-edge', (0.054, 0.046), part_x, face_y + 0.0002, part_z, INK, 0.001)
        print_card(key, (0.050, 0.042), part_x, face_y, part_z, WHITE, 0.0016)
        print_card(f'{key}-win', (0.032, 0.024), part_x, face_y - 0.00035, part_z + 0.002, SCREEN, 0)
    elif key == 'eink':
        print_card(key, (0.046, 0.034), part_x, face_y, part_z, INK, 0.001)
        print_card(f'{key}-face', (0.036, 0.022), part_x, face_y - 0.00035, part_z, SCREEN, 0)
    elif key == 'board':
        print_card(key, (0.064, 0.040), part_x, face_y, part_z, GREEN, 0.0006)
        print_card(f'{key}-imu', (0.014, 0.012), part_x - 0.012, face_y - 0.00035, part_z + 0.004, INK, 0.0003)
        print_card(f'{key}-radar', (0.016, 0.014), part_x + 0.016, face_y - 0.00035, part_z - 0.004, INK, 0.0003)
        print_card(f'{key}-die', (0.006, 0.006), part_x + 0.016, face_y - 0.0006, part_z - 0.004, SILVER, 0)
    elif key == 'piezo':
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.013, depth=0.0007, vertices=32,
            location=(part_x, face_y, part_z), rotation=(math.pi / 2, 0, 0),
        )
        piezo = bpy.context.active_object
        piezo.name = 'piezo'
        assign(piezo, INK)
        print_card(f'{key}-hole', (0.007, 0.007), part_x, face_y - 0.0004, part_z, SILVER, 0)
    elif key == 'battery':
        print_card(key, (0.040, 0.028), part_x, face_y, part_z, SILVER, 0.001)
        print_card(f'{key}-band', (0.040, 0.007), part_x, face_y - 0.00035, part_z + 0.007, INK, 0)

    callout(index, name, body, box_w, part_x, face_y, index % 2 == 0, part_half, part_z)

text_obj(
    'title',
    '하드웨어 구성',
    0.011,
    (0, Y0 - 0.0014, THICK + PLINTH_Z * 0.48),
    FACE,
    WHITE,
)

# Comparison samples stay flat on the clear plate, in front of the layers.
compare = [
    ('sirius', -0.155, (0.040, 0.032, 0.010), WHITE, (0.026, 0.016), 'Sirius', '우리 제품 · 13 g', (0.108, 0.012, 0.002)),
    ('fi', 0.0, (0.0815, 0.0303, 0.0115), GRAPHITE, (0.028, 0.010), 'Fi', '47 g', (0.138, 0.019, 0.0024)),
    ('tractive', 0.155, (0.071, 0.029, 0.017), ORANGE, (0.040, 0.008), 'Tractive', 'DOG 6 · 39 g', (0.118, 0.016, 0.0022)),
]
for key, x, size, mat, screen, name, sub, strap in compare:
    y = -0.155
    cube(f'{key}-strap', strap, (x, y + 0.004, THICK + strap[2] / 2), STRAP, bevel=0.0004)
    cube(key, size, (x, y, THICK + strap[2] + size[2] / 2), mat, bevel=min(0.0014, size[2] * 0.16))
    cube(
        f'{key}-screen',
        (screen[0], screen[1], 0.0004),
        (x, y, THICK + strap[2] + size[2] + 0.00025),
        INK,
    )
    text_obj(f'{key}-name', name, 0.011, (x, y - 0.040, THICK + 0.0006), (0, 0, 0), INK)
    text_obj(f'{key}-sub', sub, 0.008, (x, y - 0.056, THICK + 0.0006), (0, 0, 0), BLUE)

text_obj('compare', '실물 비교', 0.013, (0, -0.090, THICK + 0.0008), (0, 0, 0), NAVY)

dims = []
dims.append(text_obj('dim-w', '500 mm', 0.014, (0, -0.292, 0.002), (0, 0, 0), INK))
dims.append(text_obj('dim-d', '500 mm', 0.014, (0.292, 0, 0.002), (0, 0, math.pi / 2), INK))
dims.append(text_obj('dim-h', f'최고 {TOP_MM:.0f} mm', 0.012, (0, 0.292, 0.002), (0, 0, 0), INK))

floor = cube('floor', (3.4, 3.4, 0.002), (0, 0, -0.001), new_mat('floor', srgb('#d9d4cc'), rough=0.9, specular=0.02))
floor.is_shadow_catcher = True

world = bpy.data.worlds.new('studio')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*srgb('#cfc9c0'), 1)
bg.inputs['Strength'].default_value = 0.34


def area(name, loc, size, power, rot, color=(1, 0.98, 0.95)):
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = power
    light.shape = 'RECTANGLE'
    light.size = size[0]
    light.size_y = size[1]
    light.color = color
    obj = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot


area('key', (0.55, -0.95, 0.70), (0.85, 0.50), 20, (math.radians(52), 0, math.radians(22)))
area('fill', (-0.80, -0.55, 0.48), (0.60, 0.40), 7, (math.radians(64), 0, math.radians(-20)))
# Soft rim on the top edges only. A hard light here blows the sheet faces white.
area('edge', (0.0, 0.62, 0.42), (0.70, 0.18), 8, (math.radians(118), 0, math.pi), (0.86, 0.93, 1.0))

cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 48
cam = bpy.data.objects.new('cam', cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
target = bpy.data.objects.new('target', None)
bpy.context.collection.objects.link(target)
target.location = (0.0, 0.00, 0.07)
track = cam.constraints.new('TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

scene.render.engine = 'CYCLES'
scene.cycles.samples = 80
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 16
scene.cycles.transmission_bounces = 16
scene.cycles.transparent_max_bounces = 16
scene.cycles.device = 'CPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type != 'CPU'
    scene.cycles.device = 'GPU'
except Exception as exc:
    print('cpu fallback', exc)

scene.view_settings.view_transform = 'Standard'
scene.view_settings.exposure = 0.05
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.resolution_x = 1600
scene.render.resolution_y = 1100

print(
    f'order plate 500x500x8 plinth {PLINTH_X*1000:.0f}x{PLINTH_Y*1000:.0f}x{PLINTH_Z*1000:.0f} '
    f'sheets {SHEET_W*1000:.0f}x{SHEET_H*1000:.0f}x{SHEET_T*1000:.0f} x{N} top {TOP_MM:.1f} mm'
)

for obj in dims:
    obj.hide_render = True
cam_data.lens = 42
cam.location = (0.46, -0.74, 0.38)
target.location = (0.0, -0.04, 0.06)
scene.render.filepath = f'{OUT}/acrylic-layer-beauty.png'
bpy.ops.render.render(write_still=True)

cam_data.lens = 46
cam.location = (0.18, -0.92, 0.42)
target.location = (0.0, -0.03, 0.06)
scene.render.filepath = f'{OUT}/acrylic-layer-front.png'
bpy.ops.render.render(write_still=True)

# Standing visitor. Shelf top is 1.00 m, eye line about 1.55 m,
# so the camera sits 0.55 m above the plate and about 0.45 m
# in front of the plate's front edge. Aimed to include the flat labels.
cam_data.lens = 48
cam.location = (0.02, -0.68, 0.55)
target.location = (0.0, -0.08, 0.05)
scene.render.filepath = f'{OUT}/acrylic-layer-standing.png'
bpy.ops.render.render(write_still=True)

for obj in dims:
    obj.hide_render = False
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/acrylic-stand.blend')
print('rendered')
